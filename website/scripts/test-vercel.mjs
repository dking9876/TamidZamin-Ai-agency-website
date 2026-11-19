import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isLaunched, siteOrigin, publicContact } from './deployment.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.vercel', 'output');
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const routes = await json(resolve(output, 'config.json'));
const launched = isLaunched({ ...process.env, DEPLOY_TARGET: 'vercel' });
const origin = siteOrigin();
const contact = publicContact();
assert.equal(routes.version, 3);
assert.ok(routes.routes.some((route) => route.dest === '_render' && new RegExp(route.src).test('/api/lead/')));
assert.ok(routes.routes.some((route) => route.dest === '/404.html' && route.status === 404));
const functionRoot = resolve(output, 'functions', '_render.func');
const config = await json(resolve(functionRoot, '.vc-config.json'));
assert.equal(config.runtime, 'nodejs24.x');

for (const route of ['', 'about', 'accessibility', 'faq', 'privacy', 'contact', 'services',
  'services/phone', 'services/whatsapp']) {
  const html = await readFile(resolve(output, 'static', route, 'index.html'), 'utf8');
  assert.match(html, /lang="he"/);
  assert.match(html, /dir="rtl"/);
  assert.ok(html.includes(`name="robots" content="${launched ? 'index, follow' : 'noindex, nofollow'}"`));
  assert.ok(html.includes(`href="${origin}/${route ? route + '/' : ''}"`));
  assert.ok(html.includes(contact.whatsappUrl));
  assert.ok(html.includes(contact.phoneUrl));
  assert.doesNotMatch(html, /<form\b/);
  for (const match of html.matchAll(/(?:src|href)="(\/(?:_astro|images)\/[^"]+)"/g)) {
    assert.ok(existsSync(resolve(output, 'static', match[1].slice(1))), `Missing asset ${match[1]}`);
  }
}
const robots = await readFile(resolve(output, 'static', 'robots.txt'), 'utf8');
assert.match(robots, /Allow: \/\n/);
assert.doesNotMatch(robots, /Disallow: \/\n/);
const sitemap = await readFile(resolve(output, 'static', 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, launched ? 9 : 0);
const deployment = await json(resolve(root, 'vercel.json'));
assert.ok(deployment.headers.find((rule) => rule.source === '/(.*)').headers
  .some((header) => header.key === 'Content-Security-Policy' && header.value.includes("script-src 'self'")));
const previewRule = deployment.headers.find((rule) => rule.has?.some((condition) => condition.type === 'host'));
assert.ok(previewRule.headers.some((header) => header.key === 'X-Robots-Tag' && header.value.includes('noindex')));
const previewHost = new RegExp(`^(?:${previewRule.has[0].value})$`);
assert.equal(previewHost.test('tamidzamin-ai-agency.vercel.app'), true);
assert.equal(previewHost.test('www.tamidzamin.com'), false);
assert.ok(!deployment.headers.filter((rule) => !rule.has && new RegExp(`^${rule.source.replace(':path*', '.*')}$`).test('/contact/'))
  .some((rule) => rule.headers.some((header) => header.key === 'X-Robots-Tag' && header.value.includes('noindex'))));

const dataDir = join(tmpdir(), `tz-vercel-must-not-exist-${randomUUID()}`);
Object.assign(process.env, {
  VERCEL: '1', DEPLOY_TARGET: 'vercel', NODE_ENV: 'production',
  LEAD_DELIVERY_ENABLED: 'true', LEAD_WEBHOOK_URL: 'https://receiver.test/intake',
  LEAD_WEBHOOK_TOKEN: 'synthetic-test-not-a-real-credential',
  FORM_SECRET: 'synthetic-test-secret-not-for-production-00000000', DATA_DIR: dataDir,
});
globalThis.fetch = async () => { throw new Error('Retired intake must not make external requests'); };
const { default: handler } = await import(pathToFileURL(resolve(functionRoot, config.handler)).href);
assert.equal(typeof handler.fetch, 'function');
for (const method of ['GET', 'POST', 'PUT']) {
  const response = await handler.fetch(new Request(`${origin}/api/lead/`, {
    method, headers: { 'x-real-ip': '127.0.0.1', Origin: origin, 'Sec-Fetch-Site': 'same-origin', Accept: 'application/json' },
    ...(method === 'GET' ? {} : { body: 'name=synthetic-test' }),
  }));
  assert.equal(response.status, 410);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await response.json()).ok, false);
}
assert.equal(existsSync(dataDir), false, 'Retired intake must never create a database directory');
console.log(`PASS: Vercel ${launched ? 'production' : 'preview'} output, 9 static Hebrew routes, canonical/contact URLs, crawler controls, host-specific noindex, Node24 retired API (410), no cookies/storage/delivery.`);
