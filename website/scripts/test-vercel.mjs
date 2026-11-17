import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.vercel', 'output');
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const routes = await json(resolve(output, 'config.json'));
assert.equal(routes.version, 3);
for (const path of ['/contact/', '/api/lead/']) {
  assert.ok(routes.routes.some((route) => route.dest === '_render' && new RegExp(route.src).test(path)));
}
assert.ok(routes.routes.some((route) => route.dest === '/404.html' && route.status === 404));
const functionRoot = resolve(output, 'functions', '_render.func');
const config = await json(resolve(functionRoot, '.vc-config.json'));
assert.equal(config.runtime, 'nodejs24.x');
assert.equal(config.supportsResponseStreaming, true);

for (const route of ['', 'about', 'accessibility', 'faq', 'privacy', 'services',
  'services/phone', 'services/whatsapp']) {
  const html = await readFile(resolve(output, 'static', route, 'index.html'), 'utf8');
  assert.match(html, /lang="he"/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  for (const match of html.matchAll(/(?:src|href)="(\/(?:_astro|images)\/[^"]+)"/g)) {
    assert.ok(existsSync(resolve(output, 'static', match[1].slice(1))), `Missing asset ${match[1]}`);
  }
}
assert.match(await readFile(resolve(output, 'static', 'robots.txt'), 'utf8'), /Disallow: \//);
assert.doesNotMatch(await readFile(resolve(output, 'static', 'sitemap.xml'), 'utf8'), /<loc>/);
const deployment = await json(resolve(root, 'vercel.json'));
assert.ok(deployment.headers.find((rule) => rule.source === '/(.*)').headers
  .some((header) => header.key === 'Content-Security-Policy' && header.value.includes("script-src 'self'")));

const dataDir = join(tmpdir(), `tz-vercel-must-not-exist-${randomUUID()}`);
Object.assign(process.env, {
  VERCEL: '1', DEPLOY_TARGET: 'vercel', NODE_ENV: 'production',
  SITE_URL: 'https://vercel-preview.test', SITE_LAUNCHED: 'false',
  LEAD_DELIVERY_ENABLED: 'true', LEAD_WEBHOOK_URL: 'https://receiver.test/intake',
  LEAD_WEBHOOK_TOKEN: 'synthetic-test-not-a-real-credential',
  FORM_SECRET: 'synthetic-test-secret-not-for-production-00000000', DATA_DIR: dataDir,
});
globalThis.fetch = async () => { throw new Error('Vercel preview must not make external requests'); };
const { default: handler } = await import(pathToFileURL(resolve(functionRoot, config.handler)).href);
assert.equal(typeof handler.fetch, 'function');
const request = (path, init = {}) => new Request(`https://vercel-preview.test${path}`, {
  ...init, headers: { 'x-real-ip': '127.0.0.1', ...init.headers },
});
const contact = await handler.fetch(request('/contact/'));
assert.equal(contact.status, 200);
assert.match(contact.headers.get('cache-control'), /no-store/);
assert.match(contact.headers.get('x-robots-tag'), /noindex/);
assert.equal(contact.headers.get('set-cookie'), null);
const html = await contact.text();
assert.match(html, /<fieldset[^>]*disabled/);
assert.match(html, /action="\/api\/lead\/"/);
assert.ok(html.includes('https://vercel-preview.test/contact/'));

for (const accept of ['application/json', 'text/html']) {
  const response = await handler.fetch(request('/api/lead/', {
    method: 'POST', headers: { Accept: accept }, body: 'name=synthetic-test',
  }));
  assert.equal(response.status, 503);
  assert.match(response.headers.get('cache-control'), /no-store/);
  if (accept === 'application/json') assert.equal((await response.json()).ok, false);
  else assert.match(await response.text(), /dir="rtl"/);
}
assert.equal((await handler.fetch(request('/api/lead/'))).status, 405);
assert.equal(existsSync(dataDir), false, 'Vercel preview must not create a database directory');
console.log('PASS: Vercel output, Node 24 runtime, 8 static Hebrew/noindex routes and assets, 404 routing, robots/sitemap, header configuration, generated SSR contact and JSON/native API failure modes. No publishing or network delivery.');
