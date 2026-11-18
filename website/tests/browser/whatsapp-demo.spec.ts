import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin
    && route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
});

for (const width of [390, 1440]) {
  test(`recording at ${width}px: lazy 3x video, playback, keyboard, seek, end and replay`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.url().endsWith('/media/demo-whatsapp-3x.mp4')) requests.push(request.url());
    });
    await page.goto('/#whatsapp-demo');
    const demo = page.locator('.whatsapp-demo');
    const video = page.locator('#demo-whatsapp-video');
    const toggle = page.locator('.whatsapp-toggle');
    const seek = page.locator('.whatsapp-seek');
    await expect(toggle).toBeVisible();
    expect(requests).toEqual([]);
    await expect(seek).toBeDisabled();
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(demo).toContainText('3×');
    const responsePromise = page.waitForResponse('**/media/demo-whatsapp-3x.mp4');
    await toggle.click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('video/mp4');
    await expect(demo).toHaveAttribute('data-state', 'playing');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.2);
    const media = await video.evaluate((element: HTMLVideoElement) => ({
      duration: element.duration, width: element.videoWidth, height: element.videoHeight,
      rate: element.playbackRate, muted: element.muted, decoded: element.getVideoPlaybackQuality().totalVideoFrames,
    }));
    // Speed is baked into the asset, including the native/no-JavaScript player.
    expect(Math.abs(media.duration * 3 - 137.183447)).toBeLessThan(.15);
    expect(media).toMatchObject({ width: 720, height: 1600, rate: 1, muted: true });
    expect(media.decoded).toBeGreaterThan(0);
    await expect(video).toHaveCSS('object-fit', 'contain');
    const bounds = await video.boundingBox();
    expect(bounds!.width / bounds!.height).toBeCloseTo(720 / 1600, 2);

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(demo).toHaveAttribute('data-state', 'paused');
    await seek.fill('20');
    await seek.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(20);
    await expect(seek).toHaveAttribute('aria-valuetext', /0:20 מתוך 0:45/);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(demo).toHaveAttribute('data-state', 'playing');
    await seek.fill(String(media.duration - .2));
    await expect(demo).toHaveAttribute('data-state', 'ended');
    await toggle.click();
    await expect(demo).toHaveAttribute('data-state', 'playing');
    expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(3);
    await seek.fill('25');
    await page.locator('.whatsapp-restart').click();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(3);
    await toggle.click();
    expect(errors).toEqual([]);
  });
}

test('download failure offers a direct file and retry recovers', async ({ page }) => {
  let unavailable = true;
  await page.route('**/media/demo-whatsapp-3x.mp4', (route) => unavailable
    ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
  await page.goto('/#whatsapp-demo');
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.whatsapp-status')).toContainText('לא הצלחנו לטעון');
  await expect(page.locator('.whatsapp-download')).toBeVisible();
  unavailable = false;
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.whatsapp-status')).toBeEmpty();
  await expect(page.locator('.whatsapp-download')).toBeHidden();
});

test('pending playback can be cancelled and rapid input preserves the last intent', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/media/demo-whatsapp-3x.mp4', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/#whatsapp-demo');
  const demo = page.locator('.whatsapp-demo');
  const toggle = page.locator('.whatsapp-toggle');
  await toggle.click();
  await expect(demo).toHaveAttribute('data-state', 'loading');
  await toggle.click();
  release();
  await expect(demo).toHaveAttribute('data-state', 'idle');
  await toggle.click();
  await expect(demo).toHaveAttribute('data-state', 'playing');
  await toggle.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(demo).toHaveAttribute('data-state', 'playing');
  await toggle.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click(); });
  await expect(demo).toHaveAttribute('data-state', 'paused');
  expect(await page.locator('#demo-whatsapp-video').evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
});

test('reduced motion permits requested playback; hidden pages pause without automatic resumption', async ({ page }) => {
  await page.goto('/#whatsapp-demo');
  const demo = page.locator('.whatsapp-demo');
  await expect(demo).toHaveAttribute('data-state', 'idle');
  await page.locator('.whatsapp-toggle').click();
  await expect(demo).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(demo).toHaveAttribute('data-state', 'paused');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(demo).toHaveAttribute('data-state', 'paused');
  await page.locator('.whatsapp-toggle').click();
  await expect(demo).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(demo).toHaveAttribute('data-state', 'paused');
});

test('fullscreen provides native controls and returns to the inline player', async ({ page }) => {
  await page.goto('/#whatsapp-demo');
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
  await page.locator('.whatsapp-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('demo-whatsapp-video');
  await expect(page.locator('#demo-whatsapp-video')).toHaveAttribute('controls', '');
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator('#demo-whatsapp-video')).not.toHaveAttribute('controls', '');
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'paused');
});

test('fullscreen rejection explains recovery without interrupting playback', async ({ page }) => {
  await page.goto('/#whatsapp-demo');
  await page.locator('#demo-whatsapp-video').evaluate((video) => {
    video.requestFullscreen = () => Promise.reject(new Error('Fullscreen unavailable'));
  });
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
  await page.locator('.whatsapp-fullscreen').click();
  await expect(page.locator('.whatsapp-status')).toContainText('לא הצלחנו לפתוח מסך מלא');
  await expect(page.locator('.whatsapp-download')).toBeVisible();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
});

test('emulated touch, 44px controls and accessibility work at 320px and enlarged text', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/#whatsapp-demo');
  await page.evaluate(() => document.fonts.ready);
  const toggle = page.locator('.whatsapp-toggle');
  await toggle.tap();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
  await toggle.tap();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'paused');
  for (const selector of ['.whatsapp-toggle', '.whatsapp-restart', '.whatsapp-fullscreen', '.whatsapp-seek']) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }
  const result = await new AxeBuilder({ page }).include('#channels').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const control of await page.locator('.whatsapp-toolbar button, .whatsapp-seek').all()) {
    const bounds = await control.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});

test('without JavaScript the native player still plays the encoded 3x asset', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/#whatsapp-demo');
  await page.evaluate(() => document.fonts.ready);
  const video = page.locator('#demo-whatsapp-video');
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('controls', '');
  await expect(page.locator('.whatsapp-controls')).toBeHidden();
  await expect(page.locator('noscript .whatsapp-download')).toBeVisible();
  await video.evaluate((element: HTMLVideoElement) => element.play());
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.2);
  expect(await video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(45.708333, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});

test('service page links directly to the recorded demo without enabling the live service', async ({ page }) => {
  await page.goto('/services/whatsapp/');
  await page.getByRole('link', { name: 'לצפייה בהדגמה', exact: true }).click();
  await expect(page).toHaveURL(/#whatsapp-demo$/);
  await expect(page.locator('.whatsapp-toggle')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await page.goto('/contact/');
  await expect(page.locator('#submit-lead')).toBeDisabled();
});
