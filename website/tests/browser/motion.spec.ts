import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __premiumAnimations: Animation[];
    __premiumFrameGaps: number[];
  }
}

async function observe(page: Page) {
  await page.addInitScript(() => {
    window.__premiumAnimations = [];
    window.__premiumFrameGaps = [];
    let previous = 0;
    const sample = (now: number) => {
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSAnimation || animation instanceof CSSTransition) continue;
        if (!window.__premiumAnimations.includes(animation)) window.__premiumAnimations.push(animation);
      }
      if (previous && document.querySelector('.waveform')?.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) {
        window.__premiumFrameGaps.push(now - previous);
      }
      previous = now;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function reveal(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
}

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => {
    const request = route.request();
    return new URL(request.url()).origin === origin && request.method() === 'GET'
      ? route.continue()
      : route.abort('blockedbyclient');
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await observe(page);
});

for (const width of [390, 1440]) {
  test(`motion at ${width}px: recorded demo enters once without starting playback`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await reveal(page, '.whatsapp-channel figure');
    await page.waitForFunction(() => window.__premiumAnimations.some((animation) =>
      (animation.effect as KeyframeEffect).target?.matches('.whatsapp-demo')));
    const sequence = await page.evaluate(() => window.__premiumAnimations
      .filter((animation) => (animation.effect as KeyframeEffect).target?.matches('.whatsapp-demo'))
      .map((animation) => ({
        delay: animation.effect!.getTiming().delay,
        end: Number(animation.effect!.getComputedTiming().endTime),
        iterations: animation.effect!.getTiming().iterations,
      })));
    expect(sequence).toEqual([{ delay: 0, end: 620, iterations: 1 }]);
    await expect(page.locator('.whatsapp-channel .device-caption')).not.toContainText('אין שיחה פעילה');
    await expect(page.locator('#demo-whatsapp-video')).toHaveAccessibleName('הקלטת הדגמת וואטסאפ במהירות פי שלושה');
    expect(await page.locator('.device-caption').evaluateAll((captions) =>
      captions.every((caption) => caption.getAnimations().length === 0))).toBe(true);
    await page.waitForFunction(() => window.__premiumAnimations
      .filter((animation) => (animation.effect as KeyframeEffect).target?.matches('.whatsapp-demo'))
      .every((animation) => animation.playState === 'finished'));
    await expect(page.locator('.whatsapp-demo')).toHaveCSS('opacity', '1');
    await expect(page.locator('.whatsapp-toggle')).toBeVisible();
    expect(await page.locator('#demo-whatsapp-video').evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    await reveal(page, '#process');
    await reveal(page, '.whatsapp-demo');
    expect(await page.locator('.whatsapp-demo').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('voice waveform stays still until the recording plays and stops when paused', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await reveal(page, '.phone-channel figure');
  expect(await page.locator('.waveform').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await page.waitForFunction(() => window.__premiumFrameGaps.length > 10);
  await expect.poll(() => page.locator('.waveform i').evaluateAll((bars) =>
    new Set(bars.map((bar) => getComputedStyle(bar).transform)).size)).toBeGreaterThan(3);
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'paused');
  await reveal(page, '.home-hero');
  await reveal(page, '.phone-channel figure');
  expect(await page.locator('.waveform').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
});

test('reduced motion cancels entrances without hiding recorded demo controls or shifting the composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await reveal(page, '.whatsapp-channel figure');
  await expect(page.locator('.whatsapp-toggle')).toBeVisible();
  const before = await page.locator('#channels').boundingBox();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('#channels').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  for (const content of await page.locator('.whatsapp-toggle, .recording-toggle').all()) {
    await expect(content).toBeVisible();
    await expect(content).toHaveCSS('opacity', '1');
  }
  const after = await page.locator('#channels').boundingBox();
  expect(after!.height).toBeCloseTo(before!.height, 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.whatsapp-toggle')).toBeVisible();
  expect(await page.locator('#channels').evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
});

test('native FAQ interpolates its layout, reverses cleanly and stays keyboard operable', async ({ page }) => {
  await page.goto('/faq/');
  const details = page.locator('.faq-list details').first();
  const summary = details.locator('summary');
  await summary.focus();
  const closed = (await details.boundingBox())!.height;
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  const heights = await details.evaluate(async (element) => {
    const values: number[] = [];
    for (let frame = 0; frame < 25; frame++) {
      await new Promise(requestAnimationFrame);
      values.push(element.getBoundingClientRect().height);
    }
    return values;
  });
  const finalHeight = heights.at(-1)!;
  expect(finalHeight).toBeGreaterThan(closed + 10);
  expect(heights.some((height) => height > closed + 1 && height < finalHeight - 1)).toBe(true);
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open', '');
  await expect.poll(async () => (await details.boundingBox())!.height).toBeCloseTo(closed, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Enter');
  await expect(details.locator('p')).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(details).toHaveCSS('--motion-disclosure', /^0m?s$/);
});

test('mobile menu has a bounded entrance and an immediate reduced-motion alternative', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const summary = page.locator('.mobile-menu > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu nav')).toHaveCSS('animation-name', 'menu-arrive');
  await expect(page.locator('.menu-icon path').nth(1)).toHaveCSS('opacity', '0');
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu nav')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.mobile-menu a').first()).toBeVisible();
});
