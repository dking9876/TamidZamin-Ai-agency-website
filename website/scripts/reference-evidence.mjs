import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const root = resolve(process.env.PROJECT_ROOT || '..');
const review = join(root, '.impeccable', 'review');
const out = join(review, 'comparison-current');
await mkdir(out, { recursive: true });
const reference = join(root, 'website design assets', 'אתר TamidZamin_ סוכני AI לעסקים בישראל.webp');
const map = JSON.parse(await readFile(join(review, 'reference-regions.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
  await Promise.all([...document.images].map((image) => image.decode()));
  await document.fonts.ready;
  window.scrollTo(0, 0);
});
const boxes = await page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('main > section, .site-footer')].map((element) => {
    const box = element.getBoundingClientRect();
    const id = element.classList.contains('site-footer') ? 'footer' : [...element.classList].find((name) => name.startsWith('home-'))?.slice(5);
    const top = id === 'hero' ? 0 : Math.floor(box.top);
    return [id, { x: 0, y: top, w: 1024, h: Math.ceil(box.bottom) - top }];
  }),
));
const build = join(review, 'reference-width.png');
await page.screenshot({ path: build, fullPage: true });
await page.screenshot({ path: join(review, 'hero-repro.png'), clip: { x: 0, y: 0, width: 1024, height: boxes.hero.h } });
await browser.close();
const buildMetadata = await sharp(build).metadata();
const results = [];
for (const region of map.regions) {
  const referenceBox = { left: 0, top: region.fromY, width: 1024, height: region.toY - region.fromY };
  const actual = boxes[region.id];
  if (!actual) throw new Error(`Missing rendered region ${region.id}`);
  actual.h = Math.min(actual.h, buildMetadata.height - actual.y);
  const a = await sharp(reference).extract(referenceBox).png().toBuffer();
  const b = await sharp(build).extract({ left: 0, top: actual.y, width: 1024, height: actual.h }).png().toBuffer();
  const pair = join(out, `${region.id}.png`);
  await sharp({ create: { width: 2064, height: Math.max(referenceBox.height, actual.h), channels: 3, background: '#ffffff' } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: 1040, top: 0 }]).png().toFile(pair);
  results.push({ id: region.id, referenceBox, actualBox: actual, heightRatio: Number((actual.h / referenceBox.height).toFixed(3)), pair, interpretation: 'Left approved reference; right live build. No vertical stretching. Not an automatic fidelity pass.' });
}
await sharp(reference).extract({ left: 0, top: 0, width: 1024, height: 317 }).png().toFile(join(review, 'reference-hero.png'));
const hash = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const manifest = {
  capturedAt: new Date().toISOString(), reference, build,
  referenceSha256: await hash(reference), buildSha256: await hash(build),
  comparison: 'Named region pairs from exact current captures, preserving pixel scale; geometry and copy adaptations remain human-review decisions.',
  regions: results,
};
await writeFile(join(out, 'report.json'), JSON.stringify(manifest, null, 2));
await writeFile(join(review, 'build-evidence.json'), JSON.stringify({
  workflow: 'Manual implementation of a user-pinned supplied reference',
  currentCapture: manifest.capturedAt, currentCaptureSha256: manifest.buildSha256,
  measuredRegionMap: 'reference-regions.json', currentNamedComparisons: 'comparison-current/report.json',
  currentHeroEvidence: 'hero-repro.png',
  historicalEnginePhases: { conceptSeed: 'not run: user pinned full direction', compGeneration: 'not run: supplied approved image', heroGate: 'not run; no retrospective pass claimed', buildPhaseStateMachine: 'not run' },
  claims: { exactPixelMatch: false, historicalEngineGatePassed: false, currentHumanVerdict: 'pending' },
}, null, 2));
console.log(JSON.stringify(results.map(({ id, referenceBox, actualBox, heightRatio }) => ({ id, referenceHeight: referenceBox.height, actualHeight: actualBox.h, heightRatio })), null, 2));
