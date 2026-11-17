import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test, type TestContext } from 'node:test';
import { clientIp, readLeadConfig } from '../src/server/config.js';
import { deliverLead } from '../src/server/delivery.js';
import { getLeadForm, handleLead } from '../src/server/leads.js';
import {
  closeLeadStore, GLOBAL_RATE_LIMIT, IP_RATE_LIMIT, LeadStore, MAX_RECEIPTS,
  RATE_WINDOW_MS, RECEIPT_RETENTION_MS,
} from '../src/server/store.js';
import { issueFormToken, MIN_FORM_AGE_MS, TOKEN_LIFETIME_MS, verifyFormToken } from '../src/server/tokens.js';
import { InputError, MAX_BODY_BYTES, normalizePhone, readFormBody, validateLead } from '../src/server/validation.js';

const NOW = 1_800_000_000_000;
const SITE = 'https://tamidzamin.test';
const validFields = {
  name: 'בדיקה מקומית', phone: '050-123-4567', email: 'local@example.invalid',
  business: 'עסק בדיקה', service: 'whatsapp', message: 'בדיקה בלבד', consent: 'yes', website: '',
};

function setup(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'tz-unit-'));
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: 'production', SITE_URL: SITE, LEAD_DELIVERY_ENABLED: 'true',
    LEAD_WEBHOOK_URL: 'https://receiver.test/intake', LEAD_WEBHOOK_TOKEN: 'unit-test-token-only',
    FORM_SECRET: 'unit-test-secret-not-for-production-000000000', DATA_DIR: directory,
  };
  const result = readLeadConfig(env);
  assert.equal(result.enabled, true);
  if (!result.enabled) throw new Error('fixture_config');
  const config = result.config;
  const store = new LeadStore(directory);
  t.after(() => { store.close(); rmSync(directory, { recursive: true, force: true }); });
  const form = issueFormToken(new Request(`${SITE}/contact/`), config, NOW);
  const cookie = form.cookie!.split(';')[0]!;
  const make = (changes: Record<string, string> = {}, headers: Record<string, string> = {}) =>
    new Request(`${SITE}/api/lead`, {
      method: 'POST',
      headers: { Origin: SITE, Cookie: cookie, Accept: 'application/json', ...headers },
      body: new URLSearchParams({ ...validFields, token: form.token, ...changes }),
    });
  return { env, config, store, directory, form, cookie, make, now: () => NOW + 3000 };
}

test('configuration is disabled unless explicitly enabled and fully valid', (t) => {
  const { env } = setup(t);
  assert.equal(readLeadConfig({}).enabled, false);
  const cases: NodeJS.ProcessEnv[] = [
    { LEAD_DELIVERY_ENABLED: 'TRUE' }, { SITE_URL: 'https://example.invalid' },
    { SITE_URL: 'https://valid.test/path' }, { SITE_URL: 'https://user:pass@valid.test' },
    { SITE_URL: 'http://valid.test' }, { SITE_URL: 'javascript:alert(1)' },
    { LEAD_WEBHOOK_URL: 'http://receiver.test' }, { LEAD_WEBHOOK_URL: 'https://user:pass@receiver.test' },
    { LEAD_WEBHOOK_URL: '' }, { LEAD_WEBHOOK_TOKEN: '' }, { LEAD_WEBHOOK_TOKEN: 'bad\r\nheader' },
    { FORM_SECRET: 'short' }, { FORM_SECRET: ' '.repeat(32) },
    { DATA_DIR: 'relative/path' }, { DATA_DIR: '' },
    { LEAD_WEBHOOK_TIMEOUT_MS: '999' }, { LEAD_WEBHOOK_TIMEOUT_MS: '15001' },
    { LEAD_TRUST_PROXY: 'true', LEAD_PROXY_IPS: '' }, { LEAD_TRUST_PROXY: 'sure' },
    { LEAD_TRUST_PROXY: 'true', LEAD_PROXY_IPS: '0.0.0.0/0' },
  ];
  for (const change of cases) assert.equal(readLeadConfig({ ...env, ...change }).enabled, false, JSON.stringify(change));
});

test('insecure HTTP is allowed only with development AND explicit loopback opt-in', (t) => {
  const { env } = setup(t);
  const local = {
    ...env, SITE_URL: 'http://127.0.0.1:4397', LEAD_WEBHOOK_URL: 'http://localhost:4398/mock',
    LEAD_ALLOW_INSECURE_LOCALHOST: 'true',
  };
  assert.equal(readLeadConfig(local).enabled, false);
  assert.equal(readLeadConfig({ ...local, NODE_ENV: 'development' }).enabled, true);
  assert.equal(readLeadConfig({ ...local, NODE_ENV: 'development', LEAD_ALLOW_INSECURE_LOCALHOST: 'false' }).enabled, false);
  assert.equal(readLeadConfig({ ...local, NODE_ENV: 'development', LEAD_WEBHOOK_URL: 'http://192.0.2.1' }).enabled, false);
});

test('proxy forwarding is ignored by default and only trusted peer chains are accepted', (t) => {
  const { config } = setup(t);
  const request = new Request(SITE, { headers: { 'X-Forwarded-For': '198.51.100.8, 127.0.0.2' } });
  assert.equal(clientIp(request, '127.0.0.1', config), '127.0.0.1');
  const trusted = { ...config, trustedProxies: ['127.0.0.1', '127.0.0.2'] };
  assert.equal(clientIp(request, '127.0.0.1', trusted), '198.51.100.8');
  assert.equal(clientIp(request, '192.0.2.10', trusted), '192.0.2.10');
  assert.equal(clientIp(request, '::ffff:127.0.0.1', trusted), '198.51.100.8');
  assert.equal(clientIp(new Request(SITE, { headers: { 'X-Forwarded-For': 'garbage' } }), '127.0.0.1', trusted), undefined);
  assert.equal(clientIp(new Request(SITE), '127.0.0.1', trusted), undefined);
  assert.equal(clientIp(request, 'not-an-address', config), undefined);
  assert.equal(clientIp(request, 'fe80::1%eth0', config), undefined);
});

test('tokens are signed, session-bound, age-limited and use secure HttpOnly session cookies', (t) => {
  const { config, form, cookie } = setup(t);
  assert.match(form.cookie!, /^__Host-tz_form=/);
  assert.match(form.cookie!, /HttpOnly; SameSite=Strict; Secure$/);
  assert.doesNotMatch(form.cookie!, /Expires|Max-Age/);
  const request = new Request(SITE, { headers: { Cookie: cookie } });
  assert.deepEqual(verifyFormToken(form.token, request, config, NOW + MIN_FORM_AGE_MS - 1), { ok: false, reason: 'early' });
  assert.equal(verifyFormToken(form.token, request, config, NOW + MIN_FORM_AGE_MS).ok, true);
  assert.equal(verifyFormToken(form.token, request, config, NOW + TOKEN_LIFETIME_MS - 1).ok, true);
  assert.deepEqual(verifyFormToken(form.token, request, config, NOW + TOKEN_LIFETIME_MS), { ok: false, reason: 'expired' });
  assert.equal(verifyFormToken(form.token, request, config, NOW - 1).ok, false);
  assert.equal(verifyFormToken(form.token, new Request(SITE), config, NOW + 3000).ok, false);
  assert.equal(verifyFormToken(form.token, new Request(SITE, { headers: { Cookie: `${cookie}; ${cookie}` } }), config, NOW + 3000).ok, false);
  assert.equal(verifyFormToken(`${form.token.slice(0, -2)}xx`, request, config, NOW + 3000).ok, false);
  assert.equal(verifyFormToken(form.token, request, { ...config, secret: 'another-secret' }, NOW + 3000).ok, false);
  const another = issueFormToken(new Request(SITE), config, NOW);
  assert.equal(verifyFormToken(form.token, new Request(SITE, { headers: { Cookie: another.cookie!.split(';')[0]! } }), config, NOW + 3000).ok, false);
  assert.equal(issueFormToken(request, config, NOW).cookie, undefined);
  assert.equal(verifyFormToken('x'.repeat(513), request, config, NOW + 3000).ok, false);
});

test('phone normalization handles Israeli/mobile/landline and international shape, rejecting extensions and hostile text', () => {
  const cases: [string, string | undefined][] = [
    ['050-123-4567', '+972501234567'], ['(02) 1234567', '+97221234567'],
    ['0721234567', '+972721234567'], ['+972 (52) 345-67.89', '+972523456789'],
    ['00972501234567', '+972501234567'], ['+44 (20) 7946-0958', '+442079460958'],
    ['+12025550123', '+12025550123'], ['+12345678', '+12345678'],
    ['+123456789012345', '+123456789012345'], ['+1234567890123456', undefined],
    ['', undefined], ['050123456', undefined], ['05012345678', undefined], ['061234567', undefined],
    ['+9720501234567', undefined], ['+0123456789', undefined], ['+1234567', undefined],
    ['+1-800-FLOWERS', undefined], ['0501234567 ext 3', undefined],
    ['++12025550123', undefined], ['＋１２３４５６７８９０', undefined],
    ['+12025550123\nX-Test: 1', undefined], ['<script>123</script>', undefined],
  ];
  for (const [input, expected] of cases) assert.equal(normalizePhone(input), expected, input);
});

test('lead validation requires truthful consent, enums, valid bounded fields and normalizes optional data', () => {
  const valid = validateLead({ ...validFields, name: '  בדיקה  ', email: '', message: '' });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.lead.name, 'בדיקה');
    assert.equal(valid.lead.phone, '+972501234567');
    assert.equal(valid.lead.email, undefined);
    assert.equal(valid.lead.message, undefined);
    assert.equal(valid.lead.consent, true);
  }
  const fields: [string, string][] = [
    ['name', 'א'], ['name', 'א'.repeat(81)], ['name', 'abc\u0000xyz'], ['name', 'ab\u202ecd'],
    ['business', ''], ['business', 'a'.repeat(121)], ['phone', 'invalid'],
    ['email', 'bad@domain'], ['email', 'a..b@example.com'], ['email', 'bad@example..com'],
    ['email', `${'a'.repeat(245)}@example.com`], ['email', 'a@example.com\r\nInjected: true'],
    ['message', 'a'.repeat(2001)], ['message', 'a\u0000'], ['service', 'made-up'],
    ['consent', 'true'], ['consent', ''], ['consent', ' yes '],
  ];
  for (const [key, value] of fields) {
    const result = validateLead({ ...validFields, [key]: value });
    assert.equal(result.ok, false, `${key}: ${value.slice(0, 30)}`);
    if (!result.ok) assert.ok(result.errors[key]);
  }
  assert.equal(validateLead({ ...validFields, name: 'א'.repeat(80), business: 'ב'.repeat(120), message: '🙂'.repeat(2000) }).ok, true);
  assert.equal(validateLead({ ...validFields, message: 'שורה א\nשורה ב\tסוף' }).ok, true);
});

test('body parser rejects duplicate/unknown fields, malformed encoding, non-UTF8 and unsupported media', async () => {
  for (const body of [
    'name=a&name=b', '__proto__=pollute', 'name=%ZZ', 'name=%C0%AF', 'name',
    'name=a&&phone=b', 'token=t&extra=x',
  ]) {
    const request = new Request(SITE, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    await assert.rejects(readFormBody(request), (error: unknown) => error instanceof InputError && error.status === 400);
  }
  for (const contentType of ['application/json', 'multipart/form-data', 'text/plain', 'application/x-www-form-urlencoded; charset=iso-8859-1']) {
    await assert.rejects(readFormBody(new Request(SITE, { method: 'POST', body: 'name=a', headers: { 'Content-Type': contentType } })),
      (error: unknown) => error instanceof InputError && error.status === 415);
  }
  const request = new Request(SITE, {
    method: 'POST', body: new Uint8Array([0xff, 0xfe]),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  await assert.rejects(readFormBody(request), InputError);
});

test('body limit is enforced on streaming bytes without relying on Content-Length', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(4096).fill(65)); },
    cancel() { cancelled = true; },
  });
  const request = new Request(SITE, {
    method: 'POST', body, duplex: 'half',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  } as RequestInit & { duplex: string });
  await assert.rejects(readFormBody(request), (error: unknown) => error instanceof InputError && error.status === 413);
  assert.equal(cancelled, true);
  await assert.rejects(readFormBody(new Request(SITE, {
    method: 'POST', body: 'name=x',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': String(MAX_BODY_BYTES + 1) },
  })), (error: unknown) => error instanceof InputError && error.status === 413);
});

test('persistent per-IP and global limits are bounded and expire', (t) => {
  const { store, directory } = setup(t);
  for (let i = 0; i < IP_RATE_LIMIT; i++) assert.equal(store.takeRateLimit('hash-one', NOW).allowed, true);
  const reopened = new LeadStore(directory);
  try { assert.equal(reopened.takeRateLimit('hash-one', NOW).allowed, false); }
  finally { reopened.close(); }
  for (let i = IP_RATE_LIMIT; i < GLOBAL_RATE_LIMIT; i++) assert.equal(store.takeRateLimit(`hash-${i}`, NOW).allowed, true);
  assert.equal(store.takeRateLimit('fresh-hash', NOW).allowed, false);
  assert.equal(store.takeRateLimit('hash-one', NOW + RATE_WINDOW_MS).allowed, true);
});

test('SQLite reservations are atomic across connections and never redeliver ambiguous outcomes', (t) => {
  const { store, directory } = setup(t);
  const other = new LeadStore(directory);
  try {
  assert.equal(store.reserve('request-1', 'fingerprint', NOW, 13000).state, 'new');
  assert.equal(other.reserve('request-1', 'fingerprint', NOW, 13000).state, 'pending');
  assert.equal(other.reserve('request-1', 'different', NOW, 13000).state, 'conflict');
  assert.equal(other.reserve('request-1', 'fingerprint', NOW + 13001, 13000).state, 'unknown');
  assert.equal(store.reserve('request-1', 'fingerprint', NOW + 20000, 13000).state, 'unknown');
  store.complete('request-1', 'accepted', NOW + 21000);
  assert.equal(other.reserve('request-1', 'fingerprint', NOW + 22000, 13000).state, 'accepted');
  assert.equal(store.reserve('request-2', 'fingerprint', NOW, 13000).state, 'new');
  store.complete('request-2', 'rejected', NOW);
  assert.equal(other.reserve('request-2', 'fingerprint', NOW, 13000).state, 'rejected');
  } finally { other.close(); }
  store.prune(NOW + RECEIPT_RETENTION_MS);
  const db = new DatabaseSync(join(directory, 'leads.sqlite'));
  try { assert.equal((db.prepare('SELECT COUNT(*) AS n FROM receipts').get() as { n: number }).n, 0); }
  finally { db.close(); }
});

test('receipt capacity fails closed rather than growing without bound', (t) => {
  const { store, directory } = setup(t);
  const db = new DatabaseSync(join(directory, 'leads.sqlite'));
  try {
    db.exec('BEGIN');
    const insert = db.prepare("INSERT INTO receipts VALUES (?, 'hash', 'accepted', ?, ?)");
    for (let i = 0; i < MAX_RECEIPTS; i++) insert.run(`id-${i}`, NOW, NOW + RECEIPT_RETENTION_MS);
    db.exec('COMMIT');
    assert.equal(store.reserve('over-capacity', 'hash', NOW, 13000).state, 'full');
  } finally { db.close(); }
});

test('webhook requires explicit JSON acceptance, not a bare 2xx, truthy string, redirect or oversized response', async (t) => {
  const { config } = setup(t);
  const validation = validateLead(validFields);
  assert.equal(validation.ok, true);
  if (!validation.ok) return;
  const cases: [number, string, string, string][] = [
    [200, '{"accepted":true}', 'application/json', 'accepted'],
    [202, '{"accepted":true,"reference":"receiver-value"}', 'application/json; charset=utf-8', 'accepted'],
    [200, '{"accepted":false}', 'application/json', 'rejected'],
    [503, '{"accepted":false}', 'application/json', 'rejected'],
    [200, '{}', 'application/json', 'unknown'],
    [200, '{"accepted":"true"}', 'application/json', 'unknown'],
    [500, '{"accepted":true}', 'application/json', 'unknown'],
    [200, 'ok', 'text/plain', 'unknown'],
    [200, '{invalid', 'application/json', 'unknown'],
    [200, JSON.stringify({ accepted: true, padding: 'x'.repeat(4096) }), 'application/json', 'unknown'],
  ];
  for (const [status, body, type, state] of cases) {
    const fetcher: typeof fetch = async (_url, init) => {
      assert.equal(init?.redirect, 'error');
      assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${config.webhookToken}`);
      assert.equal(new Headers(init?.headers).get('idempotency-key'), 'test-reference');
      assert.doesNotMatch(String(init?.body), /unit-test-secret|tz_form|ipHash/);
      return new Response(body, { status, headers: { 'Content-Type': type } });
    };
    assert.equal((await deliverLead(validation.lead, 'test-reference', config, fetcher)).state, state, body.slice(0, 40));
  }
  assert.equal((await deliverLead(validation.lead, 'test-reference', config, async () => { throw new Error('private upstream failure'); })).state, 'unknown');
});

test('API rejects forged Origin/Host, missing sessions, early forms, honeypots and invalid fields without delivery', async (t) => {
  const fixture = setup(t);
  let deliveries = 0;
  const fetcher: typeof fetch = async () => { deliveries++; return Response.json({ accepted: true }); };
  const deps = { ...fixture, fetcher };
  for (const [request, status] of [
    [fixture.make({}, { Origin: 'https://evil.test', Host: 'evil.test' }), 403],
    [fixture.make({}, { Origin: '' }), 403],
    [fixture.make({}, { 'Sec-Fetch-Site': 'cross-site' }), 403],
    [fixture.make({}, { Cookie: '' }), 403],
    [fixture.make({ website: 'spam' }), 400],
    [fixture.make({ consent: '' }), 400],
    [fixture.make({ name: '' }), 400],
  ] as const) assert.equal((await handleLead(request, '192.0.2.1', deps)).status, status);
  assert.equal((await handleLead(fixture.make(), '192.0.2.1', { ...deps, now: () => NOW })).status, 400);
  assert.equal(deliveries, 0);
});

test('API confirmation/replay is truthful, does not duplicate and persists no raw PII or secrets', async (t) => {
  const fixture = setup(t);
  let deliveries = 0;
  const fetcher: typeof fetch = async () => { deliveries++; return Response.json({ accepted: true, reference: '<script>ignored</script>' }); };
  const deps = { ...fixture, fetcher };
  const first = await handleLead(fixture.make(), '192.0.2.55', deps);
  assert.equal(first.status, 201);
  const result = await first.json();
  assert.equal(result.ok, true);
  assert.match(result.reference, /^[a-f0-9-]{36}$/);
  assert.doesNotMatch(JSON.stringify(result), /receiver|script|unit-test|050-/);
  const replay = await handleLead(fixture.make(), '192.0.2.55', deps);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).reference, result.reference);
  assert.equal((await handleLead(fixture.make({ message: 'changed' }), '192.0.2.55', deps)).status, 409);
  assert.equal(deliveries, 1);
  const db = new DatabaseSync(join(fixture.directory, 'leads.sqlite'));
  try {
    const stored = JSON.stringify([
      db.prepare('SELECT * FROM receipts').all(), db.prepare('SELECT * FROM rate_buckets').all(),
    ]);
    for (const value of [validFields.name, validFields.business, validFields.email, validFields.message, '192.0.2.55', fixture.config.secret]) {
      assert.equal(stored.includes(value), false);
    }
  } finally { db.close(); }
});

test('concurrent identical requests deliver once; pending is not success', async (t) => {
  const fixture = setup(t);
  let finish!: () => void;
  const pause = new Promise<void>((resolve) => { finish = resolve; });
  let reached!: () => void;
  const started = new Promise<void>((resolve) => { reached = resolve; });
  let deliveries = 0;
  const fetcher: typeof fetch = async () => {
    deliveries++;
    reached();
    await pause;
    return Response.json({ accepted: true });
  };
  const first = handleLead(fixture.make(), '192.0.2.1', { ...fixture, fetcher });
  await started;
  const concurrent = await handleLead(fixture.make(), '192.0.2.1', { ...fixture, fetcher });
  assert.equal(concurrent.status, 409);
  assert.equal((await concurrent.json()).ok, false);
  finish();
  assert.equal((await first).status, 201);
  assert.equal(deliveries, 1);
});

test('uncertain delivery is never retried and explicit rejection also remains unsuccessful', async (t) => {
  const fixture = setup(t);
  let attempts = 0;
  const fetcher: typeof fetch = async () => { attempts++; throw new Error('timeout may have been received'); };
  const first = await handleLead(fixture.make(), '192.0.2.1', { ...fixture, fetcher });
  assert.equal(first.status, 502);
  assert.equal((await first.json()).ok, false);
  const replay = await handleLead(fixture.make(), '192.0.2.1', { ...fixture, fetcher });
  assert.equal(replay.status, 503);
  assert.equal((await replay.json()).ok, false);
  assert.equal(attempts, 1);
  const next = issueFormToken(new Request(SITE, { headers: { Cookie: fixture.cookie } }), fixture.config, NOW);
  const reject: typeof fetch = async () => { attempts++; return Response.json({ accepted: false }); };
  assert.equal((await handleLead(fixture.make({ token: next.token }), '192.0.2.1', { ...fixture, fetcher: reject })).status, 502);
  assert.equal((await handleLead(fixture.make({ token: next.token }), '192.0.2.1', { ...fixture, fetcher: reject })).status, 502);
  assert.equal(attempts, 2);
});

test('non-JS responses are Hebrew RTL HTML, never redirect or echo hostile lead text', async (t) => {
  const fixture = setup(t);
  const invalid = await handleLead(fixture.make({ email: '<script>alert(1)</script>' }, { Accept: 'text/html' }), '192.0.2.1', fixture);
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers.get('content-type')!, /^text\/html/);
  assert.equal(invalid.headers.get('location'), null);
  const html = await invalid.text();
  assert.match(html, /lang="he" dir="rtl"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /href="\/contact\/"/);
  assert.doesNotMatch(html, /<script>|alert\(1\)/);
  const success = await handleLead(fixture.make({}, { Accept: 'text/html' }), '192.0.2.1', {
    ...fixture, fetcher: async () => Response.json({ accepted: true }),
  });
  assert.equal(success.status, 201);
  assert.match(await success.text(), /role="status"/);
  assert.equal(success.headers.get('cache-control'), 'no-store, private');
});

test('disabled or unwritable configuration stays unavailable and getLeadForm does not leak secrets', async (t) => {
  const fixture = setup(t);
  const disabled = { ...fixture.env, LEAD_DELIVERY_ENABLED: 'false' };
  const response = await handleLead(fixture.make(), '192.0.2.1', { env: disabled });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  const method = await handleLead(new Request(SITE), '192.0.2.1');
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'POST');
  const original = { ...process.env };
  try {
    Object.assign(process.env, disabled);
    assert.deepEqual(getLeadForm(new Request(SITE)).enabled, false);
    Object.assign(process.env, fixture.env);
    const form = getLeadForm(new Request(SITE));
    assert.equal(form.enabled, true);
    assert.doesNotMatch(JSON.stringify(form), /unit-test-secret|unit-test-token|receiver\.test/);
    closeLeadStore();
    process.env.DATA_DIR = join(fixture.directory, 'leads.sqlite', 'cannot-be-directory');
    assert.equal(getLeadForm(new Request(SITE)).enabled, false);
    assert.equal((await handleLead(fixture.make(), '192.0.2.1')).status, 503);
  } finally {
    closeLeadStore();
    for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});

test('request rate limiting cannot be bypassed by untrusted forwarding headers', async (t) => {
  const fixture = setup(t);
  for (let i = 0; i < IP_RATE_LIMIT; i++) {
    assert.equal((await handleLead(fixture.make({ token: 'invalid' }, { 'X-Forwarded-For': `192.0.2.${i}` }), '127.0.0.1', fixture)).status, 403);
  }
  const response = await handleLead(fixture.make(), '127.0.0.1', fixture);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});
