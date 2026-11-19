import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicContact } from './deployment.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const entry = join(root, 'dist', 'server', 'entry.mjs');
assert.ok(existsSync(entry), 'Build the Node target first: npm run build');
const contact = publicContact();
const dataDir = join(tmpdir(), `tz-retired-intake-${randomUUID()}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let received = 0;
const receiver = createServer((_request, response) => {
  received++;
  response.writeHead(500).end('Retired intake must not contact this receiver');
});
await new Promise((resolve, reject) => receiver.listen(0, '127.0.0.1', resolve).once('error', reject));
const portProbe = createTcpServer();
await new Promise((resolve, reject) => portProbe.listen(0, '127.0.0.1', resolve).once('error', reject));
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [entry], {
  cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env, HOST: '127.0.0.1', PORT: String(port), VERCEL: '0', DEPLOY_TARGET: 'node',
    NODE_ENV: 'development', SITE_LAUNCHED: 'false',
    LEAD_DELIVERY_ENABLED: 'true', LEAD_ALLOW_INSECURE_LOCALHOST: 'true',
    LEAD_WEBHOOK_URL: `http://127.0.0.1:${receiver.address().port}/lead`,
    LEAD_WEBHOOK_TOKEN: 'synthetic-local-test-token',
    FORM_SECRET: 'synthetic-local-test-secret-not-a-real-credential',
    DATA_DIR: dataDir,
  },
});
let log = '';
let startupError;
child.on('error', (error) => { startupError = error; });
child.stdout.on('data', (data) => { log = (log + data).slice(-6000); });
child.stderr.on('data', (data) => { log = (log + data).slice(-6000); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (child.exitCode !== null) throw new Error(`Node server exited: ${log}`);
    try {
      ready = (await fetch(`${origin}/contact/`, { signal: AbortSignal.timeout(1000) })).ok;
    } catch (error) {
      if (attempt === 99) throw new Error(`Node server never became responsive: ${log}`, { cause: error });
    }
    if (ready) break;
    await sleep(100);
  }
  assert.ok(ready, `Contact page not ready: ${log}`);
  const page = await fetch(`${origin}/contact/`);
  assert.equal(page.headers.get('set-cookie'), null);
  const html = await page.text();
  assert.doesNotMatch(html, /<form\b/);
  assert.ok(html.includes(contact.whatsappUrl));
  assert.ok(html.includes(contact.phoneUrl));
  for (const method of ['GET', 'POST', 'PUT']) {
    const response = await fetch(`${origin}/api/lead/`, {
      method, headers: { Origin: origin, 'Sec-Fetch-Site': 'same-origin', Accept: 'application/json' },
      ...(method === 'GET' ? {} : { body: new URLSearchParams({ name: 'synthetic-local-test' }) }),
    });
    assert.equal(response.status, 410);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal((await response.json()).ok, false);
  }
  const crossSite = await fetch(`${origin}/api/lead/`, {
    method: 'POST', headers: { Origin: 'https://unrelated.test', 'Sec-Fetch-Site': 'cross-site' },
    body: new URLSearchParams({ name: 'synthetic-local-test' }),
  });
  assert.equal(crossSite.status, 403, 'Astro still rejects cross-site form-shaped requests');
  assert.equal(received, 0);
  assert.equal(existsSync(dataDir), false);
  console.log('PASS: direct-contact Node page, exact WhatsApp/phone links, no form or cookies, retired API 410, no storage and zero receiver requests even with old delivery settings enabled.');
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGTERM');
    await Promise.race([exited, sleep(3000)]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await exited;
    }
  }
  await new Promise((resolve) => receiver.close(resolve));
}
