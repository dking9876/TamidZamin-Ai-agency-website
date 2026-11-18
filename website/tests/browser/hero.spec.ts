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
      await page.waitForFunction(() => window.__heroMotion.effects.length === 3 && window.__heroMotion.frames > 3);
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
  test(`slow hero video never blocks copy; reduced motion before load: ${cancelBeforeLoad}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let releaseVideo = () => {};
    const videoGate = new Promise<void>((resolve) => { releaseVideo = resolve; });
    await page.route('**/media/hero-film*.mp4', async (route) => {
      await videoGate;
      await route.continue();
    });
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__heroMotion.effects.length === 3);
      await expect(page.locator('.hero-actions > .pill')).toBeVisible();
      await expect(page.locator('#hero-title')).toContainText('כל פנייה מתחילה');
      await expect(page.locator('.hero-poster')).toBeVisible();
      if (cancelBeforeLoad) {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'idle'));
      } else {
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'finished'));
      }
      releaseVideo();
      if (cancelBeforeLoad) {
        await expect(page.locator('.hero-video')).toBeHidden();
        await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
        expect(await page.evaluate(() => window.__heroMotion.effects.length)).toBe(3);
      } else {
        await expect(page.locator('.home-hero')).toHaveAttribute('data-video-ready', '');
        await expect(page.locator('.hero-video')).toHaveJSProperty('paused', false);
        await page.waitForFunction(() => window.__heroMotion.effects.every((animation) => animation.playState === 'finished'));
      }
    } finally {
      releaseVideo();
    }
  });
}

test('changing to reduced motion during the hero entrance leaves a sharp static composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__heroMotion.effects.length === 3 && window.__heroMotion.frames > 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('.home-hero').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  for (const line of await page.locator('.hero-title-line').all()) {
    await expect(line).toHaveCSS('filter', 'none');
    await expect(line).toHaveCSS('transform', 'none');
    await expect(line).toHaveCSS('opacity', '1');
  }
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
  await expect(page.locator('.hero-video')).toBeHidden();
  await expect(page.locator('.hero-video-toggle')).toBeHidden();
  await expect(page.locator('.hero-light')).toHaveCSS('clip-path', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
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

for (const viewport of [
  { width: 320, height: 568 }, { width: 320, height: 740 },
  { width: 360, height: 800 }, { width: 390, height: 844 },
  { width: 430, height: 932 }, { width: 600, height: 844 },
  { width: 768, height: 1024 }, { width: 844, height: 390 },
  { width: 1440, height: 900 }, { width: 1920, height: 1080 },
]) {
  test(`video fills every hero edge with overlaid text at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const mediaRequests = new Set<string>();
    page.on('request', (request) => {
      if (/\/media\/hero-(film|poster)/.test(request.url())) mediaRequests.add(new URL(request.url()).pathname);
    });
    await page.goto('/');
    const video = page.locator('.hero-video');
    await expect(page.locator('.home-hero')).toHaveAttribute('data-video-ready', '');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1);
    await expect(video).toHaveJSProperty('muted', true);
    await expect(video).toHaveJSProperty('loop', true);
    await expect(video).toHaveJSProperty('playsInline', true);
    await expect(video).toHaveCSS('object-fit', 'cover');
    const portrait = viewport.width <= 600 && viewport.height >= viewport.width;
    await expect(video).toHaveJSProperty('videoWidth', portrait ? 720 : 1280);
    await expect(video).toHaveJSProperty('videoHeight', portrait ? 1280 : 720);
    const suffix = portrait ? '-mobile' : '';
    expect(await page.locator('.hero-poster').evaluate((image: HTMLImageElement) => image.currentSrc))
      .toContain(`/media/hero-poster${suffix}.webp`);
    expect([...mediaRequests].sort()).toEqual([`/media/hero-film${suffix}.mp4`, `/media/hero-poster${suffix}.webp`]);
    const heroBox = (await page.locator('.home-hero').boundingBox())!;
    const videoBox = (await video.boundingBox())!;
    for (const axis of ['x', 'y', 'width', 'height'] as const) {
      expect(videoBox[axis]).toBeCloseTo(heroBox[axis], 0);
    }
    for (const selector of ['#hero-title', '.home-hero-copy > p', '.hero-actions']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(videoBox.x);
      expect(box.y).toBeGreaterThanOrEqual(videoBox.y);
      expect(box.x + box.width).toBeLessThanOrEqual(videoBox.x + videoBox.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(videoBox.y + videoBox.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
  });
}

test('video pauses by keyboard, stays paused on re-entry, resumes and loops silently', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('.hero-video');
  const toggle = page.locator('.hero-video-toggle');
  await expect(toggle).toHaveAttribute('data-playing', 'true');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(video).toHaveJSProperty('paused', true);
  await expect(toggle).toHaveAccessibleName('הפעלת סרטון הרקע');
  const pausedTime = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await page.locator('.home-hero').scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty('paused', true);
  expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBe(pausedTime);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAccessibleName('השהיית סרטון הרקע');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(pausedTime);
  await video.evaluate((element: HTMLVideoElement) => { element.currentTime = element.duration - 0.2; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(2);
  await expect(video).toHaveJSProperty('paused', false);
  await expect(video).toHaveJSProperty('muted', true);
});

test('video suspends offscreen and through page lifecycle, then resumes only when appropriate', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('.hero-video');
  await expect(video).toHaveJSProperty('paused', false);
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty('paused', true);
  await page.locator('.home-hero').scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty('paused', false);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(video).toHaveJSProperty('paused', true);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')));
  await expect(video).toHaveJSProperty('paused', false);
});

for (const mode of ['reduced-motion', 'no-javascript'] as const) {
  test(`${mode}: poster fills hero, actions work and video is never requested`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      javaScriptEnabled: mode !== 'no-javascript',
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const videos: string[] = [];
    page.on('request', (request) => { if (request.url().endsWith('.mp4')) videos.push(request.url()); });
    await page.goto(baseURL!);
    await expect(page.locator('.hero-video')).not.toHaveAttribute('src');
    await expect(page.locator('.hero-video-toggle')).toBeHidden();
    await expect(page.locator('.hero-poster')).toBeVisible();
    expect(await page.locator('.hero-poster').evaluate((image: HTMLImageElement) => image.currentSrc))
      .toContain('/media/hero-poster-mobile.webp');
    expect(await page.locator('.hero-poster').boundingBox()).toEqual(await page.locator('.home-hero').boundingBox());
    await page.locator('.hero-actions > .pill').click();
    await expect(page).toHaveURL(/\/contact\/$/);
    expect(videos).toEqual([]);
    await context.close();
  });
}

test('phone video download failure keeps the portrait poster without blocking the CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/media/hero-film-mobile.mp4', (route) => route.abort('failed'));
  await page.goto('/');
  await expect(page.locator('.hero-video-status')).toContainText('סרטון הרקע אינו זמין');
  await expect(page.locator('.hero-video-toggle')).toBeHidden();
  await expect(page.locator('.hero-video')).toBeHidden();
  await expect(page.locator('.hero-poster')).toBeVisible();
  await page.locator('.hero-actions > .pill').click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

for (const manuallyPaused of [false, true]) {
  test(`rotation selects the right film without losing position; manual pause: ${manuallyPaused}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const video = page.locator('.hero-video');
    await expect(video).toHaveJSProperty('videoWidth', 720);
    await expect(page.locator('.home-hero')).toHaveAttribute('data-video-ready', '');
    await video.evaluate(async (element: HTMLVideoElement) => {
      const seeked = new Promise<void>((resolve) => element.addEventListener('seeked', () => resolve(), { once: true }));
      element.currentTime = 5;
      await seeked;
    });
    if (manuallyPaused) await page.locator('.hero-video-toggle').click();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(() => page.locator('.hero-poster').evaluate((image: HTMLImageElement) => image.currentSrc))
      .toContain('/media/hero-poster.webp');
    if (manuallyPaused) {
      await expect(video).toHaveJSProperty('paused', true);
      await expect(video).not.toHaveAttribute('src');
      await expect(video).toBeHidden();
      await page.locator('.hero-video-toggle').click();
    }
    await expect(video).toHaveJSProperty('videoWidth', 1280);
    await expect(video).toHaveJSProperty('paused', false);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThanOrEqual(5);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(video).toHaveJSProperty('videoWidth', 720);
    await expect(video).toHaveJSProperty('paused', false);
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThanOrEqual(5);
    await expect(page.locator('.hero-video-status')).toBeEmpty();
  });
}

test('phone pause/play responds to touch and the page still scrolls normally', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(baseURL!);
  const toggle = page.locator('.hero-video-toggle');
  await expect(toggle).toHaveAttribute('data-playing', 'true');
  await toggle.tap();
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
  await toggle.tap();
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', false);
  await page.locator('.hero-secondary').tap();
  await expect(page).toHaveURL(/#process$/);
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', true);
  await context.close();
});

test('blocked autoplay provides an explicit manual play action', async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let blocked = true;
    HTMLMediaElement.prototype.play = function () {
      if (blocked) {
        blocked = false;
        return Promise.reject(new DOMException('Autoplay blocked for test', 'NotAllowedError'));
      }
      return play.call(this);
    };
  });
  await page.goto('/');
  await expect(page.locator('.hero-video-status')).toContainText('הדפדפן עצר');
  const toggle = page.locator('.hero-video-toggle');
  await expect(toggle).toHaveAccessibleName('הפעלת סרטון הרקע');
  await toggle.click();
  await expect(page.locator('.hero-video')).toHaveJSProperty('paused', false);
  await expect(toggle).toHaveAccessibleName('השהיית סרטון הרקע');
  await expect(page.locator('.hero-video-status')).toBeEmpty();
});
