import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = resolve('dist-seo-test');
const origin = 'https://preview.tamidzamin.test';
const astroPackage = JSON.parse(await readFile(resolve('node_modules\\astro\\package.json'), 'utf8'));
const cli = resolve('node_modules\\astro', typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin.astro);
const result = spawnSync(process.execPath, [cli, 'build', '--outDir', output], {
  stdio: 'pipe', encoding: 'utf8',
  env: {
    ...process.env, SITE_URL: origin, SITE_LAUNCHED: 'true', VERCEL: '0', DEPLOY_TARGET: 'node',
    PUBLIC_CONTACT_EMAIL: 'test@example.test', PUBLIC_LEGAL_NAME: 'TEST FIXTURE - NOT A REAL OPERATOR',
    POLICY_CONTENT_APPROVED: 'true', CAPABILITIES_APPROVED: 'true',
    ASSET_RIGHTS_CONFIRMED: 'true', LAUNCH_APPROVED: 'true',
    ASTRO_TELEMETRY_DISABLED: '1', LEAD_DELIVERY_ENABLED: 'false',
  },
});
if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'SEO fixture build failed.');
try {
  const routes = ['', 'services', 'services\\whatsapp', 'services\\phone', 'about', 'faq', 'contact', 'privacy', 'accessibility'];
  const titles = new Set();
  for (const route of routes) {
    const html = await readFile(resolve(output, 'client', route, 'index.html'), 'utf8');
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /application\/ld\+json/);
    assert.ok(html.includes(`"@type":"Organization"`));
    assert.ok(html.includes(`href="${origin}/${route ? route.replaceAll('\\', '/') + '/' : ''}"`));
    assert.ok(!html.includes('http://localhost:4321'));
    assert.ok(!html.includes('AggregateRating'));
    assert.ok(!html.includes('"legalName"'), 'Do not describe the operator as an incorporated legal entity');
    assert.doesNotMatch(html, /<form\b/);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] || '{}')['@graph'];
    assert.ok(graph.some((entry) => entry['@type'] === 'Organization' && entry.telephone === '+972584345513'));
    assert.ok(graph.some((entry) => entry['@type'] === 'WebSite' && entry.url === `${origin}/`));
    if (route.startsWith('services')) assert.ok(graph.some((entry) => entry['@type'] === 'Service'));
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title)); titles.add(title);
  }
  const sitemap = await readFile(resolve(output, 'client', 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, 9);
  assert.ok(sitemap.includes(`${origin}/contact/`));
  assert.ok(!sitemap.includes('/404'));
  const robots = await readFile(resolve(output, 'client', 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!robots.includes('Disallow: /\n'));
  assert.match(await readFile(resolve(output, 'client', '404.html'), 'utf8'), /noindex, nofollow/);
  console.log('PASS: isolated launch-mode SEO fixture: 9 static pages, 9 sitemap URLs, canonical URLs, unique titles, Organization/WebSite/Service JSON-LD, no forms, robots and noindex 404. No public deployment or external requests.');
} finally {
  // Only this script's generated build output is removed; source and preview stay intact.
  await rm(output, { recursive: true, force: true });
}
