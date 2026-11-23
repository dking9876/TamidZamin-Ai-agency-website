import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin
    && route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
});

for (const width of [390, 1440]) {
  for (const demo of [
    { root: '.call-demo', media: '#demo-call-audio', toggle: '.recording-toggle', state: '.recording-phone', baseline: 1, initial: '1' },
    { root: '.whatsapp-demo', media: '#demo-whatsapp-video', toggle: '.whatsapp-toggle', state: '.whatsapp-demo', baseline: 3, initial: '3' },
  ]) {
    test(`${demo.media} at ${width}px: speed choices control the real clock and survive pause, seek and replay`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const requests: string[] = [];
      page.on('request', (request) => {
        if (/\/media\/demo-.*\.(mp3|mp4)$/.test(request.url())) requests.push(request.url());
      });
      await page.goto('/');
      const speed = page.locator(`${demo.root} .demo-speed select`);
      const media = page.locator(demo.media);
      await expect(speed).toHaveValue(demo.initial);
      await expect(speed.locator('option')).toHaveText(['0.5×', '1×', '1.5×', '2×', '3×']);
      for (const value of ['0.5', '1', '1.5', '2', '3']) {
        await speed.selectOption(value);
        expect(await media.evaluate((element: HTMLMediaElement) => element.playbackRate)).toBeCloseTo(Number(value) / demo.baseline, 6);
        await expect(media).toHaveJSProperty('paused', true);
      }
      expect(requests).toEqual([]);
      await speed.selectOption('2');
      await page.locator(demo.toggle).click();
      await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
      await expect.poll(() => media.evaluate((element: HTMLMediaElement) => element.readyState)).toBeGreaterThanOrEqual(3);
      const clock = await media.evaluate(async (element: HTMLMediaElement) => {
        const start = element.currentTime;
        const now = performance.now();
        await new Promise((resolve) => setTimeout(resolve, 700));
        return { delta: element.currentTime - start, wall: (performance.now() - now) / 1000, rate: element.playbackRate };
      });
      expect(Math.abs(clock.delta / clock.wall - clock.rate)).toBeLessThan(.25);
      await expect(media).toHaveJSProperty('preservesPitch', true);
      await page.locator(demo.toggle).click();
      await expect(media).toHaveJSProperty('paused', true);
      const pausedAt = await media.evaluate((element: HTMLMediaElement) => element.currentTime);
      await speed.selectOption('0.5');
      expect(await media.evaluate((element: HTMLMediaElement) => element.currentTime)).toBe(pausedAt);
      await expect(media).toHaveJSProperty('paused', true);
      await expect(page.locator(`${demo.root} .demo-speed select`)).toHaveValue('0.5');
      if (demo.baseline === 1) {
        await page.locator('.recording-seek').fill('24.9');
        await expect(page.locator('.transcript-cue[data-cue="10"]')).toHaveAttribute('aria-current', 'true');
        await page.locator('.recording-restart').click();
      } else {
        await page.locator('.whatsapp-seek').fill('60');
        expect(await media.evaluate((element: HTMLMediaElement) => element.currentTime)).toBeCloseTo(20, 1);
        await expect(page.locator('.whatsapp-seek')).toHaveAttribute('aria-valuetext', '1:00 מתוך 2:17');
        await page.locator('.whatsapp-restart').click();
      }
      await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
      expect(await media.evaluate((element: HTMLMediaElement) => element.currentTime)).toBeLessThan(3);
      expect(await media.evaluate((element: HTMLMediaElement) => element.playbackRate)).toBeCloseTo(.5 / demo.baseline, 6);
      const other = demo.baseline === 1 ? '.whatsapp-demo' : '.call-demo';
      await expect(page.locator(`${other} .demo-speed select`)).toHaveValue(demo.baseline === 1 ? '3' : '1');
      await page.locator(demo.toggle).click();
    });
  }
}

test('native rate changes are reflected, fullscreen and the owner summary preserve the selected speed', async ({ page }) => {
  await page.goto('/');
  await page.locator('.whatsapp-demo .demo-speed select').selectOption('1');
  await page.locator('.whatsapp-toggle').click();
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'playing');
  await page.locator('.whatsapp-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('demo-whatsapp-video');
  await page.locator('#demo-whatsapp-video').evaluate((media: HTMLMediaElement) => { media.playbackRate = .5; });
  await expect(page.locator('.whatsapp-demo .demo-speed select')).toHaveValue('1.5');
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator('#demo-whatsapp-video')).not.toHaveAttribute('controls', '');
  await page.locator('.whatsapp-toggle').click();
  await page.locator('.call-demo .demo-speed select').selectOption('2');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await page.locator('.recording-seek').fill('134.9');
  await expect(page.locator('.recording-summary')).toBeVisible();
  await page.locator('.recording-summary .call-summary-listen').click();
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('playbackRate', 2);
  await expect(page.locator('.call-demo .demo-speed select')).toHaveValue('2');
  await expect(page.locator('.recording-transcript')).toBeVisible();
});

test('a rejected speed change surfaces a recoverable error instead of claiming success', async ({ page }) => {
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')!;
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      get: descriptor.get,
      set(value: number) {
        if (this.id === 'demo-call-audio' && value === 2) throw new DOMException('Unsupported rate', 'NotSupportedError');
        descriptor.set!.call(this, value);
      },
    });
  });
  await page.goto('/#phone-demo');
  await page.locator('.call-demo .demo-speed select').selectOption('2');
  await expect(page.locator('.recording-status')).toContainText('לא הצליח לשנות את המהירות');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.call-demo .demo-speed select')).toHaveValue('1');
  await page.locator('.call-demo .demo-speed select').selectOption('1.5');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('playbackRate', 1.5);
  await expect(page.locator('.recording-status')).toBeEmpty();
});

for (const demo of [
  { media: '#demo-call-audio', root: '.call-demo', url: '**/media/demo-call.mp3', toggle: '.recording-toggle', state: '.recording-phone', baseline: 1 },
  { media: '#demo-whatsapp-video', root: '.whatsapp-demo', url: '**/media/demo-whatsapp-3x.mp4', toggle: '.whatsapp-toggle', state: '.whatsapp-demo', baseline: 3 },
]) {
  test(`${demo.media}: a failed download and retry retain the chosen speed`, async ({ page }) => {
    let unavailable = true;
    await page.route(demo.url, (route) => unavailable ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
    await page.goto('/');
    await page.locator(`${demo.root} .demo-speed select`).selectOption('2');
    await page.locator(demo.toggle).click();
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'error');
    unavailable = false;
    await page.locator(demo.toggle).click();
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
    await expect(page.locator(`${demo.root} .demo-speed select`)).toHaveValue('2');
    expect(await page.locator(demo.media).evaluate((media: HTMLMediaElement) => media.playbackRate)).toBeCloseTo(2 / demo.baseline, 6);
  });
}

test('speed selection stays keyboard accessible at 200% text and does not override a pause or scroll preference', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const speed = page.locator('.whatsapp-demo .demo-speed select');
  await speed.focus();
  await page.keyboard.press('Home');
  await expect(speed).toHaveValue('0.5');
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('.whatsapp-phone').evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', true);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const control of await page.locator('.demo-speed select').all()) {
    const bounds = (await control.boundingBox())!;
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  const accessibility = await new AxeBuilder({ page }).include('#channels').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('without JavaScript speed controls are omitted while both channel trial actions stay beside their explanation', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/#channels');
  await expect(page.locator('.demo-speed')).toHaveCount(2);
  for (const control of await page.locator('.demo-speed').all()) await expect(control).toBeHidden();
  for (const channel of ['whatsapp', 'phone']) {
    const intro = page.locator(`.${channel}-channel .channel-intro`);
    await intro.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    const contact = intro.locator('.demo-contact');
    await expect(contact).toContainText('+972 58-401-7275');
    const button = (await contact.locator('a').boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(0);
    expect(button.y + button.height).toBeLessThanOrEqual(844);
    const phone = (await page.locator(`.${channel}-channel .phone-shell`).boundingBox())!;
    expect(button.y + button.height).toBeLessThan(phone.y);
  }
  await expect(page.locator('#channels > .demo-contact')).toHaveCount(0);
  await context.close();
});
