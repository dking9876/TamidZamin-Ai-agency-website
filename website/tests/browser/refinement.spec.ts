import { test, expect, type Page, type TestInfo } from '@playwright/test';
import sharp from 'sharp';

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1440, height: 500 },
  { width: 844, height: 390 },
];
const sectionOrder = ['', 'channels', 'process', 'trades', 'benefits', 'human', 'about', 'evidence', 'faq', 'contact'];
const motionTargets = {
  hero: '.home-hero[data-motion="hero"]',
  devices: '.whatsapp-channel .device-stage[data-motion="devices"]',
  handoff: 'ol[data-motion="handoff"]',
  photo: '.about-photo[data-motion="photo"]',
};
type MotionName = keyof typeof motionTargets;

declare global {
  interface Window {
    __refinementMotion: {
      groups: Record<string, Animation[]>;
      advanced: string[];
      forbidden: number;
    };
  }
}

async function guardRequests(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())
      || (['http:', 'https:'].includes(url.protocol) && url.origin !== origin)) {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
}

async function frames(page: Page, count = 3) {
  await page.evaluate(async (total) => {
    for (let i = 0; i < total; i++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, count);
}

async function ready(page: Page, animationFramesEnabled = true) {
  const broken = await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
    await document.fonts.ready;
    return (await Promise.all([...document.images].map(async (image) => {
      try {
        await image.decode();
        return image.complete && image.naturalWidth > 0 ? null : image.currentSrc;
      } catch {
        return image.currentSrc || image.src;
      }
    }))).filter(Boolean);
  });
  expect(broken, 'Every image must load and decode').toEqual([]);
  // Edge does not deliver rAF callbacks when the context disables JavaScript.
  // Image decoding, fonts.ready and synchronous geometry reads still work.
  if (animationFramesEnabled) await frames(page);
}

async function geometry(page: Page) {
  return page.evaluate(() => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const header = document.querySelector('.site-header')!;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollY,
      scrollWidth: document.documentElement.scrollWidth,
      contentHeight: document.documentElement.scrollHeight,
      header: { ...rect(header), position: getComputedStyle(header).position },
      measuredHeader: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
      hero: rect(document.querySelector('.home-hero')!),
      footer: rect(document.querySelector('.site-footer')!),
      sections: [...document.querySelectorAll('main > section')].map((section) => ({
        id: section.id, className: section.className, ...rect(section),
        scrollHeight: section.scrollHeight, clientHeight: section.clientHeight,
      })),
    };
  });
}

async function attachGeometry(page: Page, info: TestInfo, name: string) {
  const metrics = await geometry(page);
  await info.attach(name, { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
  return metrics;
}

// Inspect text, not decorative image overhangs. Range boxes expose overflow even
// when an ancestor hides it and document.scrollWidth therefore looks correct.
async function textClipping(page: Page) {
  return page.evaluate(() => {
    const issues: object[] = [];
    const main = document.querySelector('main')!;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const label = (element: Element) => element.id ? `#${element.id}`
      : `${element.tagName.toLowerCase()}${[...element.classList].map((c) => `.${c}`).join('')}`;
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement!;
      // The transcript is a deliberate vertical reader, verified cue-by-cue separately.
      const inTranscript = parent.closest('.recording-transcript');
      if (!node.textContent?.trim() || parent.closest('script, style, svg, [aria-hidden="true"]')) continue;
      const closed = parent.closest('details:not([open])');
      if (closed && !closed.querySelector('summary')?.contains(parent)) continue;
      const style = getComputedStyle(parent);
      if (style.visibility !== 'visible' || style.display === 'none') continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const section = parent.closest('main > section');
      if (!section) continue;
      const bounds = section.getBoundingClientRect();
      for (const r of range.getClientRects()) {
        if (!r.width || !r.height) continue;
        const detail = {
          section: label(section), element: label(parent), text: node.textContent.trim().slice(0, 100),
          rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
        };
        if (r.left < -3 || r.right > innerWidth + 3 || (!inTranscript && (r.top < bounds.top - 3 || r.bottom > bounds.bottom + 3))) {
          issues.push({ ...detail, reason: 'outside viewport width or owning section', bounds: bounds.toJSON() });
        }
        for (let ancestor: Element | null = parent; ancestor && ancestor !== main; ancestor = ancestor.parentElement) {
          const css = getComputedStyle(ancestor);
          const clipX = /hidden|clip|auto|scroll/.test(css.overflowX);
          const clipY = /hidden|clip|auto|scroll/.test(css.overflowY);
          if (!clipX && !clipY) continue;
          const box = ancestor.getBoundingClientRect();
          if ((clipX && (r.left < box.left - 3 || r.right > box.right + 3))
            || (clipY && !inTranscript && (r.top < box.top - 3 || r.bottom > box.bottom + 3))) {
            issues.push({ ...detail, reason: 'clipped by ancestor', ancestor: label(ancestor), bounds: box.toJSON() });
            break;
          }
        }
      }
    }
    return issues;
  });
}

async function assertContained(page: Page, info: TestInfo, name: string) {
  const metrics = await attachGeometry(page, info, name);
  expect.soft(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport.width + 1);
  expect.soft(await textClipping(page), 'Visible text must fit its section and clipping ancestors').toEqual([]);
  return metrics;
}

async function textContrast(screenshot: Buffer, box: { x: number; y: number; width: number; height: number }, foreground: number[]) {
  const left = Math.floor(box.x);
  const top = Math.floor(box.y);
  const region = { left, top, width: Math.ceil(box.x + box.width) - left, height: Math.ceil(box.y + box.height) - top };
  const { data, info } = await sharp(screenshot).extract(region).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(info.channels, 'Contrast samples must be RGB').toBe(3);
  const linear = Array.from({ length: 256 }, (_, value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const foregroundLuminance = 0.2126 * linear[foreground[0]] + 0.7152 * linear[foreground[1]] + 0.0722 * linear[foreground[2]];
  let minimum = Infinity;
  let worstOffset = 0;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const luminance = 0.2126 * linear[data[offset]] + 0.7152 * linear[data[offset + 1]] + 0.0722 * linear[data[offset + 2]];
    const contrast = (Math.max(luminance, foregroundLuminance) + 0.05) / (Math.min(luminance, foregroundLuminance) + 0.05);
    if (contrast < minimum) { minimum = contrast; worstOffset = offset; }
  }
  const pixel = worstOffset / info.channels;
  return {
    region,
    foreground,
    contrast: minimum,
    worstPixel: {
      x: left + pixel % info.width, y: top + Math.floor(pixel / info.width),
      rgb: [...data.subarray(worstOffset, worstOffset + 3)],
    },
  };
}

async function reveal(page: Page, selector: string) {
  await page.locator(selector).evaluate(async (element) => {
    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise<void>((resolve) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { observer.disconnect(); resolve(); }
      });
      observer.observe(element);
    });
  });
  await frames(page);
}

async function anchorVisible(page: Page, id: string) {
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await expect.poll(async () => page.evaluate((target) => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect();
    const section = document.getElementById(target)!.getBoundingClientRect();
    const obstruction = Math.max(0, header.bottom);
    return { belowHeader: section.top >= obstruction - 2, nearTop: section.top <= Math.max(header.height, obstruction) + 40 };
  }, id), { message: `#${id} must land below the visible header, near the viewport top` })
    .toEqual({ belowHeader: true, nearTop: true });
}

// Passive observation only: preserve real Animation objects before fill:none
// removes finished effects from getAnimations(). Do not replace animate or IO.
async function observeMotion(page: Page) {
  await page.addInitScript(() => {
    const state = window.__refinementMotion = { groups: {} as Record<string, Animation[]>, advanced: [] as string[], forbidden: 0 };
    const firstTimes = new WeakMap<Animation, number>();
    const isWAAPI = (animation: Animation) => !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition);
    const sample = () => {
      document.querySelectorAll<HTMLElement>('[data-motion]').forEach((group) => {
        const name = group.dataset.motion!;
        const seen = state.groups[name] ||= [];
        for (const animation of group.getAnimations({ subtree: true }).filter(isWAAPI)) {
          if (!seen.includes(animation)) seen.push(animation);
          if (animation.playState !== 'running' || animation.currentTime === null) continue;
          const time = Number(animation.currentTime);
          if (!firstTimes.has(animation)) firstTimes.set(animation, time);
          else if (time > firstTimes.get(animation)! + 1 && !state.advanced.includes(name)) state.advanced.push(name);
        }
      });
      document.querySelectorAll('.home-hero-copy > p, .hero-actions').forEach((element) => {
        state.forbidden += element.getAnimations({ subtree: true }).filter(isWAAPI).length;
      });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function waitForMotion(page: Page, name: MotionName) {
  await page.waitForFunction((key) => {
    const group = window.__refinementMotion.groups[key];
    return group?.length && group.some((animation) => animation.playState === 'running');
  }, name, { timeout: 5_000 });
}

async function startHandoff(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await observeMotion(page);
  await page.goto('/');
  await ready(page);
  await reveal(page, motionTargets.handoff);
  await waitForMotion(page, 'handoff');
}

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('TEST_BASE_URL or Playwright baseURL is required');
  await guardRequests(page, baseURL);
});

test.describe('refinement: static geometry', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const viewport of viewports) {
    test(`${viewport.width}x${viewport.height}: sections, hero, images and text containment`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await ready(page);
      const metrics = await assertContained(page, info, 'initial-geometry');
      expect(metrics.sections.map((section) => section.id)).toEqual(sectionOrder);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('html')).toHaveAttribute('lang', 'he');
      expect.soft(Math.abs(metrics.measuredHeader - metrics.header.height), 'Measured --header-height').toBeLessThanOrEqual(1);
      expect.soft(metrics.hero.bottom, 'The next section must begin below the initial viewport')
        .toBeGreaterThanOrEqual(viewport.height - 1);
      expect.soft(metrics.header.position, 'Homepage navigation overlays the footage rather than reserving a separate band').toBe('absolute');
      expect.soft(metrics.hero.top).toBe(0);
      expect.soft(metrics.hero.height).toBeGreaterThanOrEqual(Math.max(viewport.width <= 880 ? 720 : 820, viewport.height) - 1);
      if (viewport.width >= 1024) {
        for (const section of metrics.sections) {
          expect.soft(section.height, `#${section.id || 'hero'}: ${JSON.stringify(section)}`)
            .toBeGreaterThanOrEqual(viewport.height - metrics.header.height - 2);
        }
        expect.soft(metrics.footer.height, 'Footer is not a full-screen section').toBeLessThan(viewport.height - metrics.header.height);
      }
    });
  }

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    test(`${viewport.width}x${viewport.height}: hero contrast over the poster and every video scene`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await ready(page);
      const targets = [
        { selector: '.hero-title-line:first-child', minimum: 3 },
        { selector: '.hero-title-answer', minimum: 3 },
      ];
      const boxes = [];
      for (const target of targets) {
        const element = page.locator(target.selector);
        await expect(element).toBeVisible();
        const foreground = await element.evaluate((node) => getComputedStyle(node).color.match(/\d+/g)!.slice(0, 3).map(Number));
        const box = await element.boundingBox();
        expect(box, `${target.selector} must have a measurable box`).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
        boxes.push({ ...target, box: box!, foreground });
      }
      const controlSelectors = [
        '.hero-actions a',
        viewport.width > 880 ? '.desktop-nav .nav-top-link' : '.mobile-menu > summary',
        ...(viewport.width > 880 ? ['.site-header .header-cta'] : []),
      ];
      for (const selector of controlSelectors) {
        for (const element of await page.locator(selector).all()) {
          const sample = await element.evaluate((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const rect = range.getBoundingClientRect();
            return {
              box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              foreground: getComputedStyle(node).color.match(/\d+/g)!.slice(0, 3).map(Number),
            };
          });
          boxes.push({ selector, minimum: 4.5, ...sample });
        }
      }
      const hiddenControlInk = await page.addStyleTag({
        content: controlSelectors.flatMap((selector) => [selector, `${selector} *`]).join(',') + ' { color: transparent !important; text-shadow: none !important; transition: none !important; }',
      });
      const ink = page.locator('.home-hero-copy > *');
      const originalVisibility = await ink.evaluateAll((elements) => elements.map((element) => ({
        value: (element as HTMLElement).style.getPropertyValue('visibility'),
        priority: (element as HTMLElement).style.getPropertyPriority('visibility'),
      })));
      const results = [];
      try {
        // Keep button surfaces and scrims while hiding headline and control ink.
        await page.locator('#hero-title').evaluate((element) => {
          (element as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        });
        const poster = await page.screenshot({ scale: 'css', omitBackground: false });
        for (const target of boxes) results.push({ scene: 'poster', ...target, ...await textContrast(poster, target.box, target.foreground) });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await expect(page.locator('.home-hero')).toHaveAttribute('data-video-ready', '');
        await page.locator('.hero-video-toggle').evaluate((element: HTMLButtonElement) => element.click());
        await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
        for (const time of [0.1, 3.2, 6, 8.8, 11.6, 13.8]) {
          await page.locator('.hero-video').evaluate(async (element: HTMLVideoElement, position) => {
            const seeked = new Promise<void>((resolve) => element.addEventListener('seeked', () => resolve(), { once: true }));
            element.currentTime = position;
            await seeked;
          }, time);
          const background = await page.screenshot({ scale: 'css', omitBackground: false });
          for (const target of boxes) results.push({ scene: String(time), ...target, ...await textContrast(background, target.box, target.foreground) });
        }
      } finally {
        await hiddenControlInk.evaluate((element) => element.parentNode?.removeChild(element));
        await ink.evaluateAll((elements, originals) => {
          elements.forEach((element, index) => {
            const style = (element as HTMLElement).style;
            const original = originals[index];
            if (original.value) style.setProperty('visibility', original.value, original.priority);
            else style.removeProperty('visibility');
          });
        }, originalVisibility);
      }
      await info.attach('hero-contrast-metrics', { body: JSON.stringify({ viewport, results }, null, 2), contentType: 'application/json' });
      for (const result of results) {
        expect.soft(result.contrast, `${result.selector}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(result.minimum);
      }
    });
  }

  for (const width of [390, 1024, 1440]) {
    test(`${width}px: 200% root text and multiple expanded FAQs grow without clipping`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/');
      await ready(page);
      const initial = await geometry(page);
      const list = page.locator('#faq .faq-list');
      const collapsedHeight = (await list.boundingBox())!.height;
      for (const summary of await list.locator('summary').all()) await summary.click();
      await expect(list.locator('details[open]')).toHaveCount(await list.locator('details').count());
      const expandedHeight = (await list.boundingBox())!.height;
      expect(expandedHeight).toBeGreaterThan(collapsedHeight);
      const expanded = await assertContained(page, info, 'expanded-faq');
      expect(expanded.sections.find((s) => s.id === 'faq')!.height).toBeGreaterThanOrEqual(initial.sections.find((s) => s.id === 'faq')!.height);
      const rootSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await frames(page);
      expect(await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBeCloseTo(rootSize * 2, 1);
      const zoomed = await assertContained(page, info, '200-percent-root-text-expanded-faq');
      expect(zoomed.contentHeight).toBeGreaterThan(expanded.contentHeight);
      expect(zoomed.hero.height).toBeGreaterThanOrEqual(initial.hero.height);
      expect.soft(Math.abs(zoomed.measuredHeader - zoomed.header.height), 'Header measurement follows text resizing').toBeLessThanOrEqual(1);
      expect((await list.boundingBox())!.height).toBeGreaterThan(expandedHeight);
    });
  }
});

test.describe('refinement: native navigation and fallbacks', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const viewport of [viewports[1], viewports[3], viewports[4], viewports[6]]) {
    test(`${viewport.width}x${viewport.height}: direct hash, links and browser history`, async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/#process');
      await ready(page);
      await attachGeometry(page, info, 'direct-process-anchor');
      await anchorVisible(page, 'process');
      const mobile = viewport.width <= 880;
      for (const id of ['channels', 'process']) {
        if (mobile) {
          await page.locator('.mobile-menu > summary').click();
          await page.locator('.mobile-secondary > summary').click();
        } else await page.locator('.solutions-menu > summary').click();
        await page.locator(`${mobile ? '.mobile-menu' : '.desktop-nav'} a[href="/#${id}"]`).click();
        if (mobile) await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
        await anchorVisible(page, id);
      }
      await page.goBack();
      await anchorVisible(page, 'channels');
      await page.goForward();
      await anchorVisible(page, 'process');
      await page.goto('/');
      await page.locator('.hero-actions a[href="#process"]').click();
      await anchorVisible(page, 'process');
    });
  }

  test('keyboard: visible focus, skip link, Escape, focusout and native FAQ toggles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const outline = await page.locator('.skip-link').evaluate((element) => {
      const css = getComputedStyle(element);
      return { width: parseFloat(css.outlineWidth), style: css.outlineStyle };
    });
    expect(outline.width).toBeGreaterThanOrEqual(2);
    expect(outline.style).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    const summary = page.locator('.mobile-menu > summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(page.locator('.mobile-menu nav a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await page.locator('.home-hero .pill').first().focus();
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
    const questions = page.locator('#faq summary');
    await questions.nth(0).focus();
    await page.keyboard.press('Enter');
    await questions.nth(1).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#faq details[open]')).toHaveCount(2);
    await page.keyboard.press('Enter');
    await expect(page.locator('#faq details[open]')).toHaveCount(1);
  });

  test.describe('touch input', () => {
    test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
    test('same-page menu links close; outside tap closes without intercepting navigation', async ({ page }) => {
      await page.goto('/');
      const menu = page.locator('.mobile-menu');
      const toggle = menu.locator(':scope > summary');
      expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await toggle.tap();
      await expect(menu).toHaveAttribute('open', '');
      await page.locator('.mobile-secondary > summary').tap();
      const link = menu.locator('a[href="/#process"]');
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await link.tap();
      await expect(menu).not.toHaveAttribute('open', '');
      await anchorVisible(page, 'process');
      await toggle.tap();
      const brand = (await page.locator('.site-header .brand').boundingBox())!;
      const button = (await toggle.boundingBox())!;
      await page.touchscreen.tap((brand.x + brand.width + button.x) / 2, button.y + button.height / 2);
      await expect(page).toHaveURL(/#process$/);
      await expect(menu).not.toHaveAttribute('open', '');
    });
  });

  test('no JavaScript: substantive homepage, menu anchors and multiple FAQs remain usable', async ({ browser, baseURL }, info) => {
    for (const viewport of [viewports[1], viewports[4]]) {
      const context = await browser.newContext({ baseURL, javaScriptEnabled: false, reducedMotion: 'reduce', viewport, locale: 'he-IL' });
      try {
        const page = await context.newPage();
        await guardRequests(page, baseURL!);
        await page.goto('/');
        await ready(page, false);
        await expect(page.locator('main > section')).toHaveCount(10);
        for (const selector of ['#hero-title', '.home-channel h2', '.step-icon', '.about-photo', '#evidence p']) {
          for (const element of await page.locator(selector).all()) await expect(element).toBeVisible();
        }
        if (viewport.width < 881) {
          await page.locator('.mobile-menu > summary').click();
          await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
          await page.locator('.mobile-secondary > summary').click();
          await page.locator('.mobile-menu a[href="/#process"]').click();
        } else {
          await page.locator('.solutions-menu > summary').click();
          await page.locator('.desktop-nav a[href="/#process"]').click();
        }
        await anchorVisible(page, 'process');
        await attachGeometry(page, info, `no-js-anchor-${viewport.width}`);
        const questions = page.locator('#faq summary');
        await questions.nth(0).click();
        await questions.nth(1).click();
        await expect(page.locator('#faq details[open]')).toHaveCount(2);
        await assertContained(page, info, `no-js-${viewport.width}`);
        await page.goto('/#process');
        await ready(page, false);
        await anchorVisible(page, 'process');
      } finally {
        await context.close();
      }
    }
  });

  test('requested demo copy is removed while preview safeguards remain intact (no submissions)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('#channels .demo-disclosure, #whatsapp-demo-description')).toHaveCount(0);
    await expect(page.locator('.device-caption')).toHaveCount(2);
    await expect(page.locator('.whatsapp-caption')).not.toContainText('אין שיחה פעילה');
    await expect(page.locator('.recording-caption')).not.toContainText('לא שיחה חיה');
    await expect(page.locator('.recording-caption')).toHaveCSS('margin-top', '0px');
    await expect(page.locator('#demo-whatsapp-video')).toHaveAccessibleName('הקלטת הדגמת וואטסאפ במהירות פי שלושה');
    await expect(page.locator('#demo-whatsapp-video')).not.toHaveAttribute('aria-describedby');
    await expect(page.locator('#evidence .demo-disclosure')).toContainText('לא הדגמה חיה מאושרת');
    await page.goto('/contact/');
    await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
    await expect(page.locator('#submit-lead')).toBeDisabled();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
});

test.describe('refinement: actual motion runtime', () => {
  test('handoff advances, pauses offscreen, resumes, settles and never replays', async ({ page }, info) => {
    await startHandoff(page);
    await page.waitForFunction(() => window.__refinementMotion.advanced.includes('handoff'), undefined, { timeout: 3_000 });
    const timing = await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => ({
      target: (a.effect as KeyframeEffect).target?.className,
      endTime: a.effect!.getComputedTiming().endTime,
      iterations: a.effect!.getTiming().iterations,
    })));
    await info.attach('observed-handoff-timing', { body: JSON.stringify(timing, null, 2), contentType: 'application/json' });
    expect(timing).toHaveLength(7);
    expect(timing.every((a) => Number(a.endTime) > 0 && Number(a.endTime) <= 2_000 && a.iterations === 1)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => {
      const group = window.__refinementMotion.groups.handoff;
      return group.some((a) => a.playState === 'paused') && group.every((a) => a.playState === 'paused' || a.playState === 'finished');
    }, undefined, { timeout: 3_000 });
    await frames(page);
    const paused = await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => Number(a.currentTime)));
    await frames(page, 8);
    expect(await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => Number(a.currentTime)))).toEqual(paused);
    await reveal(page, motionTargets.handoff);
    await page.waitForFunction((times) => window.__refinementMotion.groups.handoff.some((a, i) => a.playState === 'running' && Number(a.currentTime) > times[i] + 20), paused, { timeout: 3_000 });
    await page.waitForFunction(() => window.__refinementMotion.groups.handoff.every((a) => a.playState === 'finished'), undefined, { timeout: 5_000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await frames(page);
    await reveal(page, motionTargets.handoff);
    await frames(page, 10);
    const final = await page.evaluate(() => ({
      count: window.__refinementMotion.groups.handoff.length,
      states: window.__refinementMotion.groups.handoff.map((a) => a.playState),
      active: document.querySelector('ol[data-motion="handoff"]')!.getAnimations({ subtree: true }).length,
      forbidden: window.__refinementMotion.forbidden,
    }));
    expect(final).toEqual({ count: 7, states: Array(7).fill('finished'), active: 0, forbidden: 0 });
  });

  for (const name of ['hero', 'devices', 'photo'] as const) {
    test(`${name}: real animation advances once and finishes within the brief-motion budget`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await observeMotion(page);
      await page.goto('/');
      if (name !== 'hero') { await ready(page); await reveal(page, motionTargets[name]); }
      await page.waitForFunction((key) => window.__refinementMotion.advanced.includes(key), name, { timeout: 5_000 });
      await page.waitForFunction((key) => window.__refinementMotion.groups[key]?.every((a) => a.playState === 'finished'), name, { timeout: 5_000 });
      const result = await page.evaluate((key) => ({
        count: window.__refinementMotion.groups[key].length,
        endTimes: window.__refinementMotion.groups[key].map((a) => a.effect!.getComputedTiming().endTime),
        forbidden: window.__refinementMotion.forbidden,
      }), name);
      const expectedCount = name === 'devices' ? 2 : name === 'hero' ? 2 : 1;
      expect(result.count).toBe(expectedCount);
      for (const endTime of result.endTimes) {
        expect(Number(endTime)).toBeGreaterThan(0);
        expect(Number(endTime)).toBeLessThanOrEqual(name === 'devices' ? 2_400 : name === 'hero' ? 1_100 : 800);
      }
      expect(result.forbidden).toBe(0);
      await reveal(page, name === 'hero' ? '#faq' : '.home-hero');
      await reveal(page, motionTargets[name]);
      await frames(page, 10);
      expect(await page.evaluate((key) => window.__refinementMotion.groups[key].length, name)).toBe(expectedCount);
    });
  }

  test('initial reduced motion leaves content visible and starts no WAAPI groups', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await observeMotion(page);
    await page.goto('/');
    await ready(page);
    for (const selector of Object.values(motionTargets)) {
      await reveal(page, selector);
      await expect(page.locator(selector)).toBeVisible();
      expect(await page.locator(selector).evaluate((element) => element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)).toBe(0);
    }
    expect(await page.evaluate(() => Object.values(window.__refinementMotion.groups).flat().length)).toBe(0);
  });

  test('live reduced-motion change cancels active effects, without hiding content or replaying', async ({ page }) => {
    await startHandoff(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__refinementMotion.groups.handoff.every((a) => a.playState === 'idle'), undefined, { timeout: 3_000 });
    for (const selector of Object.values(motionTargets)) {
      await reveal(page, selector);
      await expect(page.locator(selector)).toBeVisible();
      expect(await page.locator(selector).evaluate((element) => element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)).toBe(0);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await reveal(page, motionTargets.handoff);
    await frames(page, 10);
    expect(await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => a.playState))).toEqual(Array(7).fill('idle'));
  });

  test('synthetic visibilitychange pauses and resumes (not a real hidden-tab test)', async ({ page }, info) => {
    info.annotations.push({ type: 'limitation', description: 'Synthetic document.hidden + visibilitychange; does not establish real browser background-tab behavior.' });
    await startHandoff(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    try {
      await page.waitForFunction(() => window.__refinementMotion.groups.handoff.every((a) => a.playState === 'paused'), undefined, { timeout: 3_000 });
      await frames(page);
      const paused = await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => Number(a.currentTime)));
      await frames(page, 8);
      expect(await page.evaluate(() => window.__refinementMotion.groups.handoff.map((a) => Number(a.currentTime)))).toEqual(paused);
    } finally {
      await page.evaluate(() => {
        Reflect.deleteProperty(document, 'hidden');
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await waitForMotion(page, 'handoff');
    await page.waitForFunction(() => window.__refinementMotion.groups.handoff.every((a) => a.playState === 'finished'), undefined, { timeout: 5_000 });
  });

  test('fractional wheel input scrolls natively without section snapping', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await ready(page);
    expect(await page.evaluate(() => [document.documentElement, document.body, document.querySelector('main')!].map((element) => getComputedStyle(element).scrollSnapType))).toEqual(['none', 'none', 'none']);
    await page.mouse.move(720, 450);
    for (const delta of [137.5, 73.25]) {
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, delta);
      await page.waitForFunction((previous) => scrollY > previous + 1, before, { timeout: 3_000 });
      const after = await page.evaluate(async () => {
        let previous = scrollY;
        let stable = 0;
        for (let frame = 0; frame < 180; frame++) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          if (Math.abs(scrollY - previous) < 0.1) stable++; else stable = 0;
          previous = scrollY;
          if (stable >= 8) return scrollY;
        }
        throw new Error('Wheel scrolling did not settle');
      });
      expect(Math.abs(after - before - delta), `wheel ${delta}: scroll delta ${after - before}`).toBeLessThanOrEqual(2);
    }
  });
});
