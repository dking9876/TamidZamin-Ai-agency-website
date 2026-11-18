import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __heroMotion: { effects: Animation[]; frames: number; controlsHidden: boolean };
  }
}

async function observeHero(page: Page) {
  await page.addInitScript(() => {
    const state: Window['__heroMotion'] = window.__heroMotion = { effects: [], frames: 0, controlsHidden: false };
    const sample = () => {
      const hero = document.querySelector('.home-hero');
      if (hero) {
        const animations = hero.getAnimations({ subtree: true }).filter((animation) =>
          !(animation instanceof CSSAnimation) && !(animation instanceof CSSTransition));
        for (const animation of animations) if (!state.effects.includes(animation)) state.effects.push(animation);
        if (animations.some((animation) => animation.playState === 'running' && Number(animation.currentTime) > 0)) state.frames++;
        const action = hero.querySelector('.hero-actions > a')!;
        if (getComputedStyle(action).visibility !== 'visible' || getComputedStyle(action).opacity !== '1') state.controlsHidden = true;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await observeHero(page);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`hero ${viewport.width}px: authored entrance runs on load and reload without blocking the action`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const reload of [false, true]) {
      if (reload) await page.reload(); else await page.goto('/');
      await page.waitForFunction(() => window.__heroMotion.effects.length === 4 && window.__heroMotion.frames > 3);
      const motion = await page.evaluate(() => ({
        effects: window.__heroMotion.effects.map((animation) => ({
          target: (animation.effect as KeyframeEffect).target?.className,
          end: Number(animation.effect!.getComputedTiming().endTime),
          iterations: animation.effect!.getTiming().iterations,
          frames: (animation.effect as KeyframeEffect).getKeyframes(),
        })),
        controlsHidden: window.__heroMotion.controlsHidden,
        navigation: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type,
      }));
      expect(motion.controlsHidden).toBe(false);
      expect(motion.navigation).toBe(reload ? 'reload' : 'navigate');
      expect(motion.effects.every((effect) => effect.iterations === 1 && effect.end <= 1100)).toBe(true);
      expect(motion.effects.filter((effect) => String(effect.target).includes('hero-title'))).toHaveLength(2);
      expect(motion.effects.some((effect) => effect.frames.some((frame) => frame.clipPath))).toBe(true);
      expect(motion.effects.some((effect) => effect.frames.some((frame) => frame.filter === 'blur(3px)'))).toBe(true);
      await expect(page.locator('.hero-actions > .pill')).toBeVisible();
      await expect(page.locator('.hero-actions > .pill')).toHaveAttribute('href', '/contact/');
      await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'finished'));
      expect(await page.locator('.home-hero').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    }
  });
}

for (const cancelBeforeLoad of [false, true]) {
  test(`slow hero image never blocks copy; cancellation before load: ${cancelBeforeLoad}`, async ({ page }) => {
    let releaseImage = () => {};
    const imageGate = new Promise<void>((resolve) => { releaseImage = resolve; });
    await page.route(/\/images\/hero-\d+\.webp/, async (route) => {
      await imageGate;
      await route.continue();
    });
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__heroMotion.effects.length === 3);
      await expect(page.locator('.hero-actions > .pill')).toBeVisible();
      await expect(page.locator('#hero-title')).toContainText('כל פנייה מתחילה');
      if (cancelBeforeLoad) {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'idle'));
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      } else {
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'finished'));
      }
      releaseImage();
      await page.waitForFunction(() => document.querySelector<HTMLImageElement>('.home-hero-image')!.naturalWidth > 0);
      if (cancelBeforeLoad) {
        await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
        expect(await page.evaluate(() => window.__heroMotion.effects.length)).toBe(3);
        expect(await page.locator('.home-hero-image').evaluate((image) => image.getAnimations().length)).toBe(0);
      } else {
        await page.waitForFunction(() => window.__heroMotion.effects.length === 4);
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'finished'));
      }
    } finally {
      releaseImage();
    }
  });
}

test('changing to reduced motion during the hero entrance leaves a sharp static composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__heroMotion.effects.length === 4 && window.__heroMotion.frames > 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('.home-hero').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  for (const line of await page.locator('.hero-title-line').all()) {
    await expect(line).toHaveCSS('filter', 'none');
    await expect(line).toHaveCSS('transform', 'none');
    await expect(line).toHaveCSS('opacity', '1');
  }
  await expect(page.locator('.home-hero-image')).toHaveCSS('transform', 'none');
  await expect(page.locator('.hero-light')).toHaveCSS('clip-path', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await page.locator('.home-hero').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
});

for (const width of [320, 390, 600]) {
  test(`mobile hero ${width}px: one dominant action and a quieter, complete first viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.hero-actions > .pill')).toHaveCount(1);
    await expect(page.locator('.hero-secondary')).toHaveAttribute('href', '#process');
    await expect(page.locator('.hero-points')).toBeHidden();
    await expect(page.locator('.scroll-cue')).toBeHidden();
    const primary = (await page.locator('.hero-actions > .pill').boundingBox())!;
    const secondary = (await page.locator('.hero-secondary').boundingBox())!;
    expect(primary.width).toBeGreaterThan(secondary.width + 80);
    expect(primary.height).toBeGreaterThanOrEqual(56);
    expect(secondary.height).toBeGreaterThanOrEqual(44);
    expect(primary.y + primary.height).toBeLessThanOrEqual(844);
    expect(secondary.y + secondary.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.locator('.hero-actions > .pill').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.hero-secondary')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#process$/);
  });
}
