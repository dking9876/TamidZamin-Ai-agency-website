import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const output = resolve(process.env.REVIEW_DIR || resolve(repository, '.impeccable', 'review', 'refinement'));
const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1440, height: 500 },
  { width: 844, height: 390 },
];
const compositions = ['channels', 'process', 'human', 'about', 'faq', 'contact'];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let i = 0; i < 3; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const box = (element) => {
      const r = element.getBoundingClientRect();
      return {
        top: r.top, bottom: r.bottom, documentTop: r.top + scrollY, documentBottom: r.bottom + scrollY,
        left: r.left, right: r.right, width: r.width, height: r.height,
      };
    };
    const textBounds = (element) => {
      const boxes = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim() || node.parentElement.closest('script, style, svg, [aria-hidden="true"]')) continue;
        const closed = node.parentElement.closest('details:not([open])');
        if (closed && !closed.querySelector('summary')?.contains(node.parentElement)) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) if (r.width && r.height) boxes.push(r);
      }
      return boxes.length ? {
        top: Math.min(...boxes.map((r) => r.top)) + scrollY,
        bottom: Math.max(...boxes.map((r) => r.bottom)) + scrollY,
        left: Math.min(...boxes.map((r) => r.left)),
        right: Math.max(...boxes.map((r) => r.right)),
      } : null;
    };
    const header = document.querySelector('.site-header');
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio },
      scrollY,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      header: { ...box(header), position: getComputedStyle(header).position },
      measuredHeaderHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
      hero: box(document.querySelector('.home-hero')),
      contentHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      sections: [...document.querySelectorAll('main > section')].map((section, index) => {
        const bounds = box(section);
        const text = textBounds(section);
        return {
          index, id: section.id || null, className: section.className, ...bounds,
          scrollHeight: section.scrollHeight, clientHeight: section.clientHeight,
          contentHeight: text ? text.bottom - text.top : 0,
          textBounds: text,
          textOutsideSection: !!text && (text.top < bounds.documentTop - 3 || text.bottom > bounds.documentBottom + 3),
          textOutsideViewportWidth: !!text && (text.left < -3 || text.right > innerWidth + 3),
        };
      }),
      footer: box(document.querySelector('.site-footer')),
      images: [...document.images].map((image) => ({
        src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0,
        naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      })),
    };
  });
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { baseURL, capturedAt: new Date().toISOString(), browser: browser.version(), captures: [] };
try {
  for (const viewport of viewports) {
    const name = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({
      viewport, deviceScaleFactor: 1, locale: 'he-IL', reducedMotion: 'reduce', hasTouch: viewport.width < 881,
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      await page.route('**/*', (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (!['GET', 'HEAD'].includes(request.method())
          || (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(baseURL).origin)) {
          return route.abort('blockedbyclient');
        }
        return route.continue();
      });
      const response = await page.goto(new URL('/', baseURL).href, { waitUntil: 'load' });
      if (!response?.ok()) throw new Error(`${name}: homepage returned HTTP ${response?.status()}`);
      await page.evaluate(async () => {
        [...document.images].forEach((image) => { image.loading = 'eager'; });
        await Promise.all([...document.images].map(async (image) => {
          try { await image.decode(); } catch { throw new Error(`Image failed to decode: ${image.currentSrc || image.src}`); }
        }));
        await document.fonts.ready;
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await settle(page);
      const metrics = await measure(page);
      const files = [`${name}-full.png`, `${name}-hero.png`];
      await page.screenshot({ path: resolve(output, files[0]), fullPage: true });
      await page.screenshot({ path: resolve(output, files[1]) });
      if (viewport.width >= 1024 && viewport.height > 500) {
        for (const id of compositions) {
          await page.locator(`#${id}`).evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
          await settle(page);
          const file = `${name}-${id === 'contact' ? 'closing' : id}.png`;
          await page.locator(`#${id}`).screenshot({ path: resolve(output, file) });
          files.push(file);
        }
      }
      // Consistent optional states make before/after directories directly comparable.
      if (viewport.width === 390 || (viewport.width === 1440 && viewport.height === 900)) {
        for (const summary of await page.locator('#faq summary').all()) await summary.click();
        await settle(page);
        const file = `${name}-faq-expanded.png`;
        await page.locator('#faq').screenshot({ path: resolve(output, file) });
        files.push(file);
        metrics.expandedFAQ = await measure(page);
      }
      if (viewport.width === 390) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.locator('.mobile-menu > summary').click();
        await settle(page);
        const file = `${name}-menu.png`;
        await page.screenshot({ path: resolve(output, file) });
        files.push(file);
      }
      report.captures.push({ name, files, metrics });
      console.log(`${name}: ${files.length} captures; hero bottom ${metrics.hero.bottom.toFixed(2)}; header ${metrics.header.height.toFixed(2)}; overflow ${metrics.horizontalOverflow}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(resolve(output, 'metrics.json'), JSON.stringify(report, null, 2));
}
console.log(`Saved ${report.captures.length} viewport records to ${output}`);
