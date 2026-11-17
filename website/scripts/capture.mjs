import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve(process.env.REVIEW_DIR || '..\\.impeccable\\review');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const metrics = [];
for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844], ['reference-width', 1024, 768], ['user-508', 508, 906]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
    await Promise.all([...document.images].map((image) => image.decode()));
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  if (name === 'desktop') await page.screenshot({ path: resolve(output, 'hero.png') });
  metrics.push(await page.evaluate(() => ({
    viewport: innerWidth, height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
    sections: [...document.querySelectorAll('main > section')].map((s) => ({ name: s.className, top: Math.round(s.getBoundingClientRect().top), height: Math.round(s.getBoundingClientRect().height) })),
    imageBytes: performance.getEntriesByType('resource').filter((e) => e.name.includes('/images/')).reduce((sum, e) => sum + e.transferSize, 0),
  })));
  if (name === 'mobile') {
    await page.locator('.mobile-menu summary').click();
    await page.screenshot({ path: resolve(output, 'mobile-menu.png') });
    await page.goto('http://localhost:4321/contact/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: resolve(output, 'contact-mobile.png'), fullPage: true });
  }
  await page.close();
}
await writeFile(resolve(output, 'render-metrics.json'), JSON.stringify(metrics, null, 2));
await browser.close();
console.log(JSON.stringify(metrics, null, 2));
