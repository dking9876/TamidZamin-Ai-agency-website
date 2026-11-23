import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({
  reducedMotion: 'no-preference',
  launchOptions: { args: ['--autoplay-policy=document-user-activation-required'] },
  // Trace snapshots grant user activation and would invalidate this suite.
  trace: 'off',
});

async function reveal(page: Page, selector: string) {
  const box = (await page.locator(selector).boundingBox())!;
  const height = page.viewportSize()!.height;
  await page.mouse.move(8, height / 2);
  await page.mouse.wheel(0, box.y + box.height / 2 - height / 2);
  await page.waitForTimeout(100);
}

async function playbackProbe(page: Page) {
  // Playwright locator reads grant activation; keep the initial proof in CDP.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Runtime.evaluate', {
    expression: 'document.fonts.ready.then(() => true)',
    awaitPromise: true, userGesture: false,
  });
  const read = async () => (await cdp.send('Runtime.evaluate', {
    expression: `({
      activation: navigator.userActivation.hasBeenActive,
      videoPaused: document.querySelector('#demo-whatsapp-video').paused,
      videoMuted: document.querySelector('#demo-whatsapp-video').muted,
      frames: document.querySelector('#demo-whatsapp-video').getVideoPlaybackQuality().totalVideoFrames,
      audioPaused: document.querySelector('#demo-call-audio').paused,
      audioMuted: document.querySelector('#demo-call-audio').muted,
      audioTime: document.querySelector('#demo-call-audio').currentTime,
      phoneState: document.querySelector('.recording-phone').dataset.state,
    })`,
    returnByValue: true, userGesture: false,
  })).result.value;
  const scroll = async (selector: string) => {
    const result = await cdp.send('Runtime.evaluate', {
      expression: `(() => { const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return box.top + box.height / 2 - innerHeight / 2; })()`,
      returnByValue: true, userGesture: false,
    });
    // Native wheel input models a visitor's scroll without click activation.
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x: 8, y: 450, deltaX: 0, deltaY: result.result.value,
    });
  };
  const click = async (selector: string) => {
    const result = await cdp.send('Runtime.evaluate', {
      expression: `(() => { const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; })()`,
      returnByValue: true, userGesture: false,
    });
    const { x, y } = result.result.value;
    await page.mouse.click(x, y);
  };
  return { read, scroll, click, close: () => cdp.detach() };
}

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin
    && route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
});

for (const width of [390, 1440]) {
  test(`scroll at ${width}px plays WhatsApp silently but waits for a sound-start click when the browser blocks the call`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/\/media\/demo-(call\.mp3|whatsapp-3x\.mp4)$/.test(request.url())) requests.push(request.url());
    });
    await page.goto('/');
    expect(requests).toEqual([]);
    const video = page.locator('#demo-whatsapp-video');
    const audio = page.locator('#demo-call-audio');
    const { read, scroll, close } = await playbackProbe(page);
    expect(await read()).toMatchObject({ activation: false, videoPaused: true, audioPaused: true });
    await scroll('.whatsapp-phone');
    await expect.poll(read).toMatchObject({ activation: false, videoPaused: false, videoMuted: true });
    await expect.poll(async () => (await read()).frames).toBeGreaterThan(0);
    if (width === 390) {
      expect((await read()).audioPaused).toBe(true);
      expect(requests.some((url) => url.endsWith('demo-call.mp3'))).toBe(false);
    }
    await scroll('.recording-phone');
    await expect.poll(read).toMatchObject({
      activation: false, audioPaused: true, audioMuted: false, audioTime: 0, phoneState: 'blocked',
    });
    await page.waitForTimeout(350);
    expect(await read()).toMatchObject({ activation: false, audioPaused: true, audioTime: 0, phoneState: 'blocked' });
    await close();
    const toggle = page.locator('.recording-toggle');
    await expect(toggle).toHaveAccessibleName('להאזנה לשיחת ההדגמה עם קול');
    await expect(toggle).toContainText('להאזנה עם קול');
    await expect(toggle).toHaveAccessibleDescription(/הדפדפן חסם הפעלה אוטומטית עם קול/);
    await expect(page.locator('.recording-download')).toBeHidden();
    const toggleBox = (await toggle.boundingBox())!;
    await page.mouse.click(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
    const resumed = await playbackProbe(page);
    await expect.poll(resumed.read).toMatchObject({ activation: true, audioPaused: false, audioMuted: false, phoneState: 'playing' });
    await expect.poll(async () => (await resumed.read()).audioTime).toBeGreaterThan(.2);
    await resumed.close();
    await expect(page.locator('.recording-status')).toBeEmpty();
    await expect(page.locator('.transcript-cue[aria-current="true"]')).toHaveCount(1);
    await expect(page.locator('.recording-sound')).toHaveAccessibleName('השתקת קול בשיחת ההדגמה');
    await page.locator('.recording-sound').focus();
    await page.keyboard.press('Space');
    await expect(audio).toHaveJSProperty('muted', true);
    await expect(page.locator('.recording-sound')).toHaveAccessibleName('הפעלת קול בשיחת ההדגמה');
    const sound = page.locator('.recording-sound');
    const soundBox = (await sound.boundingBox())!;
    await page.mouse.click(soundBox.x + soundBox.width / 2, soundBox.y + soundBox.height / 2);
    await expect(audio).toHaveJSProperty('muted', false);
    await expect(audio).toHaveJSProperty('paused', false);
    await expect(page.locator('.recording-sound')).toHaveAccessibleName('השתקת קול בשיחת ההדגמה');
    await reveal(page, '#process');
    await expect(video).toHaveJSProperty('paused', true);
    await expect(audio).toHaveJSProperty('paused', true);
    await reveal(page, '.recording-phone');
    await expect(audio).toHaveJSProperty('paused', true);
    await reveal(page, '.whatsapp-phone');
    await expect(video).toHaveJSProperty('paused', true);
    expect(errors).toEqual([]);
  });

  test(`scroll at ${width}px starts the real call with sound when a prior visitor gesture permits it`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const { read, scroll, click, close } = await playbackProbe(page);
    expect(await read()).toMatchObject({ activation: false, audioPaused: true, audioTime: 0 });
    await click('.home-hero h1');
    expect(await read()).toMatchObject({ activation: true, audioPaused: true, audioTime: 0 });
    await scroll('.recording-phone');
    await expect.poll(read).toMatchObject({ activation: true, audioPaused: false, audioMuted: false, phoneState: 'playing' });
    await expect.poll(async () => (await read()).audioTime).toBeGreaterThan(.2);
    await close();
    await expect(page.locator('.recording-status')).toBeEmpty();
    await expect(page.locator('.recording-sound')).toHaveAccessibleName('השתקת קול בשיחת ההדגמה');
  });
}

for (const demo of [
  { frame: '.whatsapp-phone', state: '.whatsapp-demo', media: '#demo-whatsapp-video', toggle: '.whatsapp-toggle', status: '.whatsapp-status', blocked: 'error' },
  { frame: '.recording-phone', state: '.recording-phone', media: '#demo-call-audio', toggle: '.recording-toggle', status: '.recording-status', blocked: 'blocked' },
]) {
  test(`${demo.media}: manual pause and completion are never overridden by scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/');
    await page.locator('.home-hero h1').click();
    await reveal(page, demo.frame);
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
    await page.locator(demo.toggle).click();
    await expect(page.locator(demo.media)).toHaveJSProperty('paused', true);
    await reveal(page, '.home-hero');
    await reveal(page, demo.frame);
    await expect(page.locator(demo.media)).toHaveJSProperty('paused', true);
    await page.locator(demo.toggle).click();
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
    await page.locator(demo.media).evaluate((media: HTMLMediaElement) => { media.currentTime = media.duration - .1; });
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'ended');
    await reveal(page, '.home-hero');
    await reveal(page, demo.frame);
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'ended');
  });

  test(`${demo.media}: blocked autoplay explains the manual fallback and retries on click`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      document.addEventListener('click', () => { document.documentElement.dataset.manualPlayback = 'true'; }, true);
      HTMLMediaElement.prototype.play = function () {
        if (this.id.startsWith('demo-') && !document.documentElement.dataset.manualPlayback) {
          this.dataset.blockedAttempts = String(Number(this.dataset.blockedAttempts || 0) + 1);
          return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
        }
        return play.call(this);
      };
    });
    await page.goto('/');
    await reveal(page, demo.frame);
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', demo.blocked);
    await expect(page.locator(demo.status)).toContainText('הדפדפן חסם');
    await reveal(page, '.home-hero');
    await reveal(page, demo.frame);
    await expect(page.locator(demo.media)).toHaveAttribute('data-blocked-attempts', '1');
    if (demo.blocked === 'blocked') {
      await expect(page.locator('.recording-download')).toBeHidden();
      await page.locator('.call-demo .demo-speed select').selectOption('2');
      await expect(page.locator(demo.media)).toHaveJSProperty('paused', true);
      await expect(page.locator(demo.media)).toHaveAttribute('data-blocked-attempts', '1');
    }
    await page.locator(demo.toggle).focus();
    await page.keyboard.press('Space');
    await expect(page.locator(demo.state)).toHaveAttribute('data-state', 'playing');
    await expect(page.locator(demo.status)).toBeEmpty();
    if (demo.blocked === 'blocked') {
      await expect(page.locator(demo.media)).toHaveJSProperty('muted', false);
      await expect(page.locator(demo.media)).toHaveJSProperty('playbackRate', 2);
    }
  });
}

test('sound-start fallback preserves matching phones, readable controls and accessibility at 200% mobile text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      return this.id === 'demo-call-audio'
        ? Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'))
        : play.call(this);
    };
  });
  await page.goto('/');
  await reveal(page, '.recording-phone');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'blocked');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const phones = await page.locator('.device-stage .phone-shell').evaluateAll((elements) => elements.map((element) => {
    const { width, height } = element.getBoundingClientRect();
    return { width, height };
  }));
  expect(phones[0].width).toBeCloseTo(phones[1].width, 0);
  expect(phones[0].height).toBeCloseTo(phones[1].height, 0);
  const toggle = page.locator('.recording-toggle');
  const label = await toggle.locator('.recording-action').boundingBox();
  const bounds = (await toggle.boundingBox())!;
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  expect(label!.x).toBeGreaterThanOrEqual(0);
  expect(label!.x + label!.width).toBeLessThanOrEqual(320);
  await expect(toggle).toHaveAccessibleName('להאזנה לשיחת ההדגמה עם קול');
  await expect(toggle).toHaveAccessibleDescription(/הדפדפן חסם/);
  const accessibility = await new AxeBuilder({ page }).include('#channels').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('scrolling away cancels pending automatic loads without late playback or an error', async ({ page }) => {
  const releases: Array<() => void> = [];
  await page.route('**/media/demo-*', async (route) => {
    if (!/\.(mp3|mp4)$/.test(route.request().url())) return route.continue();
    await new Promise<void>((resolve) => releases.push(resolve));
    await route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.locator('.home-hero h1').click();
  await reveal(page, '.whatsapp-phone');
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'loading');
  await expect.poll(() => releases.length).toBeGreaterThanOrEqual(2);
  await reveal(page, '.home-hero');
  await expect(page.locator('.whatsapp-demo')).toHaveAttribute('data-state', 'idle');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'idle');
  releases.forEach((release) => release());
  await reveal(page, '.whatsapp-phone');
  for (const selector of ['#demo-whatsapp-video', '#demo-call-audio']) {
    await expect(page.locator(selector)).toHaveJSProperty('paused', true);
  }
  await expect(page.locator('.recording-status')).toBeEmpty();
  await expect(page.locator('.whatsapp-status')).toBeEmpty();
});

test('reduced motion stops automatic previews and never restarts them on a preference change', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.locator('.home-hero h1').click();
  await reveal(page, '.whatsapp-phone');
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', false);
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', true);
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await reveal(page, '.home-hero');
  await reveal(page, '.whatsapp-phone');
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', true);
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', true);
});

test('hidden and restored pages do not resume automatic recordings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.locator('.home-hero h1').click();
  await reveal(page, '.whatsapp-phone');
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', false);
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', false);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await reveal(page, '.home-hero');
  await reveal(page, '.whatsapp-phone');
  await expect(page.locator('#demo-whatsapp-video')).toHaveJSProperty('paused', true);
  await expect(page.locator('#demo-call-audio')).toHaveJSProperty('paused', true);
});

test('Super Tris trial links stay separate from agency contacts and work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  await page.goto('/#channels');
  const contact = page.locator('.demo-contact');
  await expect(contact).toHaveCount(2);
  await expect(contact).toHaveText([/נסו בעצמכם את סופר טריס.*\+972 58-401-7275/s, /נסו בעצמכם את סופר טריס.*\+972 58-401-7275/s]);
  await expect(contact.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+972584017275');
  await expect(contact.locator('a[href^="https://wa.me/"]')).toHaveAttribute('href', 'https://wa.me/972584017275');
  await expect(page.locator('.hero-actions > .pill')).toHaveAttribute('href', /^https:\/\/wa\.me\/972584345513\?text=/);
  await expect(page.locator('#channels > .demo-contact')).toHaveCount(0);
  for (const link of await contact.locator('a').all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
