import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = dirname(dirname(scriptPath));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (process.argv.includes('--mock')) {
  const records = [];
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/stats') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(records));
      return;
    }
    if (request.method !== 'POST' || request.url !== '/lead' ||
        request.headers.authorization !== `Bearer ${process.env.MOCK_TOKEN}`) {
      response.writeHead(403).end();
      return;
    }
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 32768) { response.writeHead(413).end(); return; }
    }
    let payload;
    try { payload = JSON.parse(body); }
    catch { response.writeHead(400).end(); return; }
    const mode = payload.lead?.message;
    records.push({ id: payload.requestId, key: request.headers['idempotency-key'], mode });
    if (mode === 'mock:timeout') return;
    if (mode === 'mock:slow') await sleep(300);
    if (response.destroyed) return;
    response.writeHead(mode === 'mock:reject' ? 422 : 200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(mode === 'mock:unconfirmed' ? { queued: true } :
      mode === 'mock:reject' ? { accepted: false } : { accepted: true, reference: 'mock-only' }));
  });
  server.listen(0, '127.0.0.1', () => process.send?.({ port: server.address().port }));
} else {
  await run();
}

async function run() {
  const entry = join(root, 'dist', 'server', 'entry.mjs');
  assert.ok(existsSync(entry), 'Build the website first: npm run build');
  const directory = mkdtempSync(join(tmpdir(), 'tz-delivery-'));
  const children = new Set();
  const token = randomBytes(32).toString('base64url');
  const secret = randomBytes(48).toString('base64url');
  let browser;

  function launch(args, env, ipc = false) {
    const child = spawn(process.execPath, args, {
      cwd: root, env: { ...process.env, ...env },
      stdio: ipc ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    children.add(child);
    let log = '';
    child.stdout.on('data', (chunk) => { log = (log + chunk).slice(-12000); });
    child.stderr.on('data', (chunk) => { log = (log + chunk).slice(-12000); });
    child.on('error', () => {});
    child.output = () => log;
    return child;
  }

  async function stop(child) {
    if (!child) return;
    if (child.exitCode === null && child.signalCode === null) {
      const exit = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exit, sleep(3000)]);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await exit;
      }
    }
    children.delete(child);
  }

  try {
    const mock = launch([scriptPath, '--mock'], { MOCK_TOKEN: token }, true);
    const mockPort = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Local mock did not start')), 10000);
      mock.once('message', (message) => { clearTimeout(timer); resolve(message.port); });
      mock.once('error', (error) => { clearTimeout(timer); reject(error); });
      mock.once('exit', () => { clearTimeout(timer); reject(new Error(`Mock exited: ${mock.output()}`)); });
    });
    const webhook = `http://127.0.0.1:${mockPort}`;
    const stats = async () => (await fetch(`${webhook}/stats`)).json();

    async function start(label, enabled = true, overrides = {}) {
      const port = await unusedPort();
      const origin = `http://127.0.0.1:${port}`;
      const child = launch([entry], {
        HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'development',
        SITE_URL: origin, SITE_LAUNCHED: 'false',
        PUBLIC_CONTACT_EMAIL: '', PUBLIC_PHONE: '', PUBLIC_WHATSAPP: '',
        PUBLIC_BOOKING_URL: '', PUBLIC_LEGAL_NAME: '',
        LEAD_DELIVERY_ENABLED: String(enabled),
        LEAD_ALLOW_INSECURE_LOCALHOST: 'true',
        LEAD_WEBHOOK_URL: `${webhook}/lead`, LEAD_WEBHOOK_TOKEN: token,
        FORM_SECRET: secret, DATA_DIR: join(directory, label),
        LEAD_WEBHOOK_TIMEOUT_MS: '1000', LEAD_TRUST_PROXY: 'false', LEAD_PROXY_IPS: '',
        ...overrides,
      });
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) throw new Error(`Astro exited: ${child.output()}`);
        try {
          const response = await fetch(`${origin}/contact/`, { signal: AbortSignal.timeout(1500) });
          if (response.ok) return { child, origin };
        } catch { /* The child may still be starting. */ }
        await sleep(100);
      }
      throw new Error(`Astro /contact/ did not become ready: ${child.output()}`);
    }

    async function form(origin, wait = true) {
      const response = await fetch(`${origin}/contact/`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('cache-control') ?? '', /no-store/, '/contact/ must never cache session-bound tokens');
      const html = await response.text();
      const formTag = html.match(/<form\b(?=[^>]*\bid=["']lead-form["'])[^>]*>/i)?.[0] ?? '';
      assert.match(formTag, /\baction=["']\/api\/lead\/["']/i,
        'Parent form action must be /api/lead/ to avoid a POST-to-GET canonical redirect');
      assert.match(formTag, /\bmethod=["']post["']/i);
      const input = html.match(/<input\b(?=[^>]*\bname=["']token["'])[^>]*>/i)?.[0];
      const formToken = input?.match(/\bvalue=["']([^"']+)["']/)?.[1];
      assert.ok(formToken, 'Parent /contact/ must render the token hidden input');
      const cookies = response.headers.getSetCookie();
      const cookie = cookies.find((value) => /^tz_form=/.test(value))?.split(';')[0];
      assert.ok(cookie, 'Parent /contact/ must apply the HttpOnly session cookie');
      assert.match(cookies.join(';'), /HttpOnly/i);
      assert.match(cookies.join(';'), /SameSite=Strict/i);
      if (wait) await sleep(2100);
      return { token: formToken, cookie };
    }

    const fields = (session, changes = {}) => new URLSearchParams({
      name: 'בדיקה מקומית בלבד', phone: '+12025550123', email: 'local@example.invalid',
      business: 'עסק בדיקה בלבד', service: 'both', message: 'mock:accept',
      consent: 'yes', website: '', token: session.token, ...changes,
    });
    const submit = (origin, session, changes = {}, headers = {}) => fetch(`${origin}/api/lead/`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Origin: origin, Cookie: session.cookie, Accept: 'application/json',
        'Sec-Fetch-Site': 'same-origin', ...headers },
      body: fields(session, changes),
    });
    const expect = async (response, status, ok = false) => {
      const text = await response.text();
      assert.equal(response.status, status, `Unexpected response: ${text.slice(0, 500)}`);
      assert.equal(response.headers.get('location'), null);
      const result = JSON.parse(text);
      assert.equal(result.ok, ok);
      assert.equal(JSON.stringify(result).includes(token), false);
      assert.equal(JSON.stringify(result).includes(secret), false);
      return result;
    };

    const boundary = await start('boundaries');
    const origin = boundary.origin;
    const session = await form(origin, false);
    await expect(await submit(origin, session), 400); // 1: too fast
    await sleep(2100);
    await expect(await submit(origin, session, {}, { Origin: 'https://hostile.invalid' }), 403);
    await expect(await submit(origin, session, {}, { Origin: '' }), 403);
    await expect(await submit(origin, session, {}, { Cookie: '' }), 403); // 2
    await expect(await submit(origin, session, { website: 'bot' }), 400); // 3
    const validation = await expect(await submit(origin, session, { phone: 'bad', consent: '' }), 400); // 4
    assert.ok(validation.errors.phone && validation.errors.consent);
    await expect(await submit(origin, session, {}, { 'Content-Type': 'application/json' }), 415); // 5
    await expect(await fetch(`${origin}/api/lead/`, {
      method: 'POST', headers: { Origin: origin, Cookie: session.cookie, Accept: 'application/json',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/x-www-form-urlencoded' }, body: 'name=%ZZ',
    }), 400); // 6
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode(`message=${'x'.repeat(40000)}`)); controller.close(); },
    });
    await expect(await fetch(`${origin}/api/lead/`, {
      method: 'POST', duplex: 'half', body: stream,
      headers: { Origin: origin, Cookie: session.cookie, Accept: 'application/json',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/x-www-form-urlencoded' },
    }), 413); // 7: chunked, no Content-Length
    const accepted = await expect(await submit(origin, session), 201, true); // 8
    assert.match(accepted.reference, /^[a-f0-9-]{36}$/);
    const replay = await expect(await submit(origin, session), 200, true); // 9
    assert.equal(replay.reference, accepted.reference);
    await expect(await submit(origin, session, { message: 'changed' }), 409); // 10
    const html = await submit(origin, session, {}, { Accept: 'text/html' }); // 11
    assert.equal(html.status, 200);
    assert.match(await html.text(), /lang="he" dir="rtl"/);
    const invalidHtml = await submit(origin, session, { phone: 'bad' }, {
      Accept: 'text/html', 'Sec-Fetch-Site': '',
    }); // 12: native/older browsers without Fetch Metadata must also work
    assert.equal(invalidHtml.status, 400);
    assert.match(await invalidHtml.text(), /role="alert"/);
    const limited = await submit(origin, session, {}, { 'X-Forwarded-For': '198.51.100.1' });
    await expect(limited, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal((await stats()).length, 1);
    await stop(boundary.child);
    console.log('PASS: real SSR form, CSRF/Origin, validation, chunked size limit, HTML/JSON, rate limit, accepted replay');

    const delivery = await start('delivery');
    const deliveryForm = await form(delivery.origin);
    const concurrent = await Promise.all([
      submit(delivery.origin, deliveryForm, { message: 'mock:slow' }),
      submit(delivery.origin, deliveryForm, { message: 'mock:slow' }),
    ]);
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [201, 409]);
    await expect(await submit(delivery.origin, deliveryForm, { message: 'mock:slow' }), 200, true);
    for (const [mode, replayStatus] of [['mock:reject', 502], ['mock:unconfirmed', 503], ['mock:timeout', 503]]) {
      const next = await form(delivery.origin);
      const started = Date.now();
      await expect(await submit(delivery.origin, next, { message: mode }), 502);
      if (mode === 'mock:timeout') assert.ok(Date.now() - started < 5000, 'Webhook timeout must be bounded');
      await expect(await submit(delivery.origin, next, { message: mode }), replayStatus);
    }
    const records = await stats();
    assert.equal(records.length, 5, 'Each request ID reaches the mock at most once');
    assert.ok(records.every((record) => record.id === record.key));
    assert.equal(new Set(records.map((record) => record.id)).size, records.length);
    await stop(delivery.child);
    console.log('PASS: concurrent deduplication, receiver rejection, missing confirmation, timeout and no automatic retries');

    for (const [label, enabled, overrides] of [
      ['disabled', false, {}],
      ['invalid-config', true, { FORM_SECRET: 'too-short' }],
    ]) {
      const unavailable = await start(label, enabled, overrides);
      const response = await fetch(`${unavailable.origin}/contact/`);
      const html = await response.text();
      assert.ok(!/<input\b(?=[^>]*\bname=["']token["'])(?=[^>]*\bvalue=["'][^"']+["'])[^>]*>/i.test(html));
      await expect(await submit(unavailable.origin, { token: 'unavailable', cookie: '' }), 503);
      await stop(unavailable.child);
    }
    assert.equal((await stats()).length, 5);
    console.log('PASS: disabled and invalid configuration remain unavailable; no secrets in public responses');

    const { chromium, expect: browserExpect } = await import('@playwright/test');
    const browserSite = await start('browser');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({
      locale: 'he-IL', viewport: { width: 1280, height: 900 }, serviceWorkers: 'block',
    });
    const blockedOrigins = new Set();
    await context.route('**/*', async (route) => {
      const destination = new URL(route.request().url());
      if (destination.origin === browserSite.origin) await route.continue();
      else {
        blockedOrigins.add(destination.origin);
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
        browserErrors.push(message.text());
      }
    });
    const status = page.locator('#form-status');
    const button = page.locator('#submit-lead');
    const browserName = 'בדיקת דפדפן מקומית בלבד';
    const browserBusiness = 'עסק בדיקה ללא שליחה אמיתית';

    async function fillBrowserForm(mode, phone = '+12025550123') {
      await page.goto(`${browserSite.origin}/contact/`, { waitUntil: 'networkidle' });
      assert.deepEqual(browserErrors, [],
        'Browser scripts must execute under the site CSP; disable Astro script inlining rather than relaxing script-src');
      await browserExpect(button).toBeEnabled();
      await page.getByLabel('שם מלא', { exact: false }).fill(browserName);
      await page.locator('#phone').fill(phone);
      await page.locator('#business').fill(browserBusiness);
      await page.locator('#email').fill('browser@example.invalid');
      await page.locator('#service').selectOption('both');
      await page.locator('#message').fill(mode);
      await page.locator('#consent').check();
      // The real signed token intentionally cannot be submitted during its first two seconds.
      await page.waitForTimeout(2100);
    }

    async function browserSubmit(expectedStatus, accepted = false) {
      const [response] = await Promise.all([
        page.waitForResponse((candidate) =>
          candidate.url() === `${browserSite.origin}/api/lead/` && candidate.request().method() === 'POST'),
        button.click(),
      ]);
      assert.equal(response.status(), expectedStatus);
      assert.match(response.headers()['content-type'] ?? '', /^application\/json/,
        'The real UI must submit via its fetch handler, not fall through to a native HTML navigation');
      const result = await response.json();
      assert.equal(result.ok, accepted);
      await browserExpect(status).toHaveAttribute('data-state', accepted ? 'success' : 'error');
      await browserExpect(status).toContainText(result.message);
      await browserExpect(page.locator('#lead-form')).not.toHaveAttribute('aria-busy', 'true');
      if (result.reference) {
        assert.match(result.reference, /^[a-f0-9-]{36}$/);
        await browserExpect(status).toContainText('מספר פנייה:');
        await browserExpect(status).toContainText(result.reference);
      }
      assert.equal((await page.content()).includes(secret), false);
      assert.equal((await page.content()).includes(token), false);
      return result;
    }

    // type=tel has no client pattern: this exercises a real server-side field error,
    // rather than bypassing the UI handler or triggering only native required validation.
    await fillBrowserForm('mock:accept', '123');
    const invalid = await browserSubmit(400);
    assert.ok(invalid.errors.phone);
    await browserExpect(page.locator('#phone-error')).toContainText(invalid.errors.phone);
    await browserExpect(page.locator('#phone')).toHaveAttribute('aria-invalid', 'true');
    await browserExpect(page.locator('#phone')).toHaveValue('123');
    await browserExpect(page.locator('#name')).toHaveValue(browserName);
    await browserExpect(page.locator('#business')).toHaveValue(browserBusiness);
    await browserExpect(page.locator('#email')).toHaveValue('browser@example.invalid');
    await browserExpect(page.locator('#message')).toHaveValue('mock:accept');
    await browserExpect(page.locator('#consent')).toBeChecked();
    await browserExpect(button).toBeEnabled();
    assert.equal((await stats()).length, 5, 'Invalid browser submission must not reach the receiver');

    await page.locator('#phone').fill('+12025550123');
    const browserAccepted = await browserSubmit(201, true);
    await browserExpect(button).toBeDisabled();
    await browserExpect(button).toHaveText('הבקשה התקבלה');
    await browserExpect(page.locator('#phone')).not.toHaveAttribute('aria-invalid', 'true');
    assert.ok((await stats()).some((record) => record.id === browserAccepted.reference && record.key === record.id));
    console.log('PASS: real Edge validation error preserves inputs, correction succeeds, reference shown, submit disabled');

    for (const mode of ['mock:reject', 'mock:unconfirmed', 'mock:timeout']) {
      await fillBrowserForm(mode);
      const failed = await browserSubmit(502);
      assert.ok(failed.reference, 'Ambiguous/rejected delivery must show the visitor a reference');
      await browserExpect(button).toBeDisabled();
      await browserExpect(status).not.toHaveAttribute('data-state', 'success');
      await browserExpect(page.locator('#name')).toHaveValue(browserName);
      await browserExpect(page.locator('#phone')).toHaveValue('+12025550123');
      await browserExpect(page.locator('#business')).toHaveValue(browserBusiness);
      await browserExpect(page.locator('#message')).toHaveValue(mode);
      if (mode === 'mock:reject') await browserExpect(status).toContainText('לא קיבלה את הפנייה');
      else await browserExpect(status).toContainText('אין לשלוח אותה שוב');
    }
    const finalRecords = await stats();
    assert.equal(finalRecords.length, 9);
    assert.ok(finalRecords.every((record) => record.id === record.key));
    assert.equal(new Set(finalRecords.map((record) => record.id)).size, finalRecords.length);
    assert.deepEqual(browserErrors, [], 'The real browser must not have uncaught JavaScript errors');
    assert.deepEqual([...blockedOrigins], [], 'All page resources must remain on the isolated local site');
    await context.close();
    await browser.close();
    browser = undefined;
    await stop(browserSite.child);
    console.log('PASS: real Edge rejection, missing confirmation and timeout preserve inputs, show errors/references, prevent resubmission');
    console.log('Local-only delivery verification passed. No real communications were sent.');
  } finally {
    try {
      await browser?.close();
    } finally {
      for (const child of [...children]) await stop(child);
      rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  }
}

async function unusedPort() {
  const socket = createTcpServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  return port;
}
