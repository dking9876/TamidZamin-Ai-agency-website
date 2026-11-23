import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin
    && route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
});

for (const width of [390, 1440]) {
  test(`real recording at ${width}px: lazy loading, playback, keyboard pause, seek and replay`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    const mediaRequests: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.url().endsWith('/media/demo-call.mp3')) mediaRequests.push(request.url());
    });
    await page.goto('/#phone-demo');
    const player = page.locator('.recording-phone');
    const toggle = page.locator('.recording-toggle');
    const audio = page.locator('#demo-call-audio');
    const seek = page.locator('.recording-seek');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName('לחצו להאזנה לשיחת ההדגמה');
    expect(mediaRequests).toEqual([]);
    expect(await audio.evaluate((element: HTMLAudioElement) => ({ paused: element.paused, muted: element.muted, volume: element.volume })))
      .toEqual({ paused: true, muted: false, volume: 1 });
    await expect(seek).toBeDisabled();
    const responsePromise = page.waitForResponse('**/media/demo-call.mp3');
    await toggle.click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('audio/mpeg');
    await expect(player).toHaveAttribute('data-state', 'playing');
    await expect(toggle).toHaveAccessibleName('השהיה של שיחת ההדגמה');
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(.2);
    expect(await audio.evaluate((element: HTMLAudioElement) => element.duration)).toBeCloseTo(135, 0);
    expect(await audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBeGreaterThanOrEqual(2);
    await expect(seek).toBeEnabled();

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(player).toHaveAttribute('data-state', 'paused');
    const pausedAt = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true);
    await seek.fill('40');
    await seek.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(40);
    await expect(seek).toHaveAttribute('aria-valuetext', /0:40 מתוך 2:15/);
    expect(pausedAt).toBeLessThan(40);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(player).toHaveAttribute('data-state', 'playing');
    await seek.fill(String(await audio.evaluate((element: HTMLAudioElement) => element.duration - .25)));
    await expect(player).toHaveAttribute('data-state', 'ended');
    await expect(toggle).toHaveAccessibleName('להאזנה שוב לשיחת ההדגמה');
    await toggle.click();
    await expect(player).toHaveAttribute('data-state', 'playing');
    expect(await audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeLessThan(3);
    await seek.fill('50');
    await page.locator('.recording-restart').click();
    await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeLessThan(3);
    await toggle.click();
    expect(errors).toEqual([]);
  });
}

test('download failure is visible and retry loads the real recording', async ({ page }) => {
  let unavailable = true;
  await page.route('**/media/demo-call.mp3', (route) => unavailable
    ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
  await page.goto('/#phone-demo');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.recording-status')).toContainText('לא הצלחנו לטעון');
  await expect(page.locator('.recording-download')).toBeVisible();
  unavailable = false;
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('.recording-status')).toBeEmpty();
  await expect(page.locator('.recording-download')).toBeHidden();
});

test('a pending load can be cancelled and rapid toggles do not restart cancelled audio', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/media/demo-call.mp3', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/#phone-demo');
  const toggle = page.locator('.recording-toggle');
  const phone = page.locator('.recording-phone');
  await toggle.click();
  await expect(phone).toHaveAttribute('data-state', 'loading');
  await toggle.click();
  release();
  await expect(phone).toHaveAttribute('data-state', 'idle');
  await expect.poll(() => page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.paused)).toBe(true);
  await toggle.click();
  await expect(phone).toHaveAttribute('data-state', 'playing');
  await toggle.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(phone).toHaveAttribute('data-state', 'playing');
  await toggle.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click(); });
  await expect(phone).toHaveAttribute('data-state', 'paused');
  expect(await page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.paused)).toBe(true);
});

test('reduced motion stops waveform motion, not requested audio; page hiding pauses without auto-resume', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#phone-demo');
  const phone = page.locator('.recording-phone');
  await page.locator('.recording-toggle').click();
  await expect(phone).toHaveAttribute('data-state', 'playing');
  expect(await page.locator('.waveform').evaluate((waveform) => waveform.getAnimations({ subtree: true }).length)).toBe(0);
  await expect.poll(() => page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.currentTime)).toBeGreaterThan(.2);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.locator('.waveform').evaluate((waveform) => waveform.getAnimations({ subtree: true }).length)).toBe(13);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(phone).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(phone).toHaveAttribute('data-state', 'paused');
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(phone).toHaveAttribute('data-state', 'paused');
  await page.locator('.recording-toggle').click();
  await expect(phone).toHaveAttribute('data-state', 'playing');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(phone).toHaveAttribute('data-state', 'paused');
});

test('mobile touch controls, focus, layout and accessibility work in idle and playing states', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/#phone-demo');
  const toggle = page.locator('.recording-toggle');
  await toggle.tap();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await toggle.tap();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'paused');
  await toggle.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toHaveCSS('outline-style', 'solid');
  for (const selector of ['.recording-toggle', '.recording-seek', '.recording-sound', '.recording-restart']) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  }
  const result = await new AxeBuilder({ page }).include('#channels').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});

test('without JavaScript the native audio controls and direct recording link remain available', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  await page.goto('/#phone-demo');
  await expect(page.locator('#demo-call-audio')).toBeVisible();
  await expect(page.locator('#demo-call-audio')).toHaveAttribute('controls', '');
  await expect(page.locator('.recording-toggle')).toBeHidden();
  await expect(page.locator('noscript .recording-download')).toBeVisible();
  await page.locator('#demo-call-audio').press('Space');
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', false);
  await expect.poll(() => page.locator('#demo-call-audio').evaluate((media: HTMLMediaElement) => media.currentTime)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
