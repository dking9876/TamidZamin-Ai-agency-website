import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import transcript from '../../src/data/call-transcript.json' with { type: 'json' };

async function loadAndPause(page: Page) {
  await page.goto('/#phone-demo');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await page.locator('.recording-toggle').click();
  await expect.poll(() => page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.paused)).toBe(true);
}

for (const width of [320, 768, 1024, 1440]) {
  test(`all transcript cues synchronize and remain readable after seeks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadAndPause(page);
    const problems = await page.evaluate(async (cues) => {
      const audio = document.querySelector<HTMLMediaElement>('#demo-call-audio')!;
      const viewport = document.querySelector<HTMLElement>('.recording-transcript')!;
      const elements = [...document.querySelectorAll<HTMLElement>('.transcript-cue')];
      const issues: string[] = [];
      const initialPageScroll = scrollY;
      for (let index = 0; index < cues.length; index++) {
        await new Promise<void>((resolve) => {
          audio.addEventListener('seeked', () => resolve(), { once: true });
          audio.currentTime = (cues[index].start + cues[index].end) / 2;
        });
        const active = document.querySelector('.transcript-cue[aria-current="true"]');
        if (active !== elements[index]) issues.push(`Wrong cue at ${audio.currentTime}`);
        const box = elements[index].getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();
        if (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) issues.push(`Cue ${index} is not fully visible`);
        if (box.left < bounds.left || box.right > bounds.right) issues.push(`Cue ${index} overflows horizontally`);
        if (viewport.scrollWidth > viewport.clientWidth) issues.push(`Transcript overflows horizontally at cue ${index}`);
        if (Math.abs(scrollY - initialPageScroll) > 1) issues.push(`Seek ${index} scrolled the page`);
      }
      return issues;
    }, transcript);
    expect(problems).toEqual([]);
    await page.locator('.recording-restart').click();
    await expect.poll(() => page.locator('.recording-transcript').evaluate((element) => element.scrollTop)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('normal playback highlights from the media clock without drift and freezes on pause', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadAndPause(page);
  const cue = transcript[3];
  await page.locator('.recording-seek').fill(String(cue.start));
  await page.locator('.recording-toggle').click();
  const timing = await page.evaluate(async (cues) => {
    const audio = document.querySelector<HTMLMediaElement>('#demo-call-audio')!;
    const mismatches: number[] = [];
    let mismatchSince: number | null = null;
    let checked = 0;
    const until = performance.now() + 2500;
    while (performance.now() < until) {
      await new Promise(requestAnimationFrame);
      const expected = cues.findIndex((cue) => audio.currentTime >= cue.start && audio.currentTime < cue.end);
      const active = document.querySelector<HTMLElement>('.transcript-cue[aria-current="true"]');
      const actual = active ? Number(active.dataset.cue) : -1;
      if (actual !== expected) {
        mismatchSince ??= performance.now();
        mismatches.push(performance.now() - mismatchSince);
      } else mismatchSince = null;
      checked++;
    }
    return { checked, longestMismatch: Math.max(0, ...mismatches) };
  }, transcript);
  expect(timing.checked).toBeGreaterThan(20);
  expect(timing.longestMismatch).toBeLessThan(100);
  await page.locator('.recording-toggle').click();
  const paused = await page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.currentTime);
  const active = await page.locator('.transcript-cue[aria-current="true"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-cue')));
  await page.waitForTimeout(300);
  expect(await page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement) => audio.currentTime)).toBe(paused);
  expect(await page.locator('.transcript-cue[aria-current="true"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-cue')))).toEqual(active);
});

test('manual reading suspends auto-scroll; return-to-call restores context without moving the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadAndPause(page);
  const middle = transcript[Math.floor(transcript.length / 2)];
  await page.locator('.recording-seek').fill(String(middle.start + .05));
  const reader = page.locator('.recording-transcript');
  await reader.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.recording-follow')).toBeVisible();
  await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBe(0);
  const later = transcript[transcript.length - 4];
  await page.locator('#demo-call-audio').evaluate((audio: HTMLMediaElement, time) => { audio.currentTime = time; }, later.start + .05);
  await expect(page.locator(`.transcript-cue[data-cue="${transcript.length - 4}"]`)).toHaveAttribute('aria-current', 'true');
  expect(await reader.evaluate((element) => element.scrollTop)).toBe(0);
  const scroll = await page.evaluate(() => scrollY);
  await page.locator('.recording-follow').click();
  await expect(page.locator('.recording-follow')).toBeHidden();
  await expect(reader).toBeFocused();
  expect(await reader.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
});

test('gaps and end-of-recording never highlight an unheard speaker; backward seeks reset correctly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadAndPause(page);
  const gap = transcript.findIndex((cue, index) => index > 0 && cue.start - transcript[index - 1].end > .15);
  expect(gap).toBeGreaterThan(0);
  const silence = (transcript[gap - 1].end + transcript[gap].start) / 2;
  await page.locator('.recording-seek').fill(String(silence));
  await expect(page.locator('.transcript-cue[aria-current]')).toHaveCount(0);
  await page.locator('.recording-seek').fill('134.9');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'ended');
  await expect(page.locator('.transcript-cue[aria-current]')).toHaveCount(0);
  await page.locator('.recording-seek').fill(String(transcript[1].start + .05));
  await expect(page.locator('.transcript-cue[data-cue="1"]')).toHaveAttribute('aria-current', 'true');
});

test('the transcript supports enlarged text, keyboard reading and accessible current-cue semantics', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadAndPause(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const reader = page.getByRole('region', { name: 'תמליל שיחת ההדגמה' });
  await reader.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(reader).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('End');
  await expect(page.locator('.recording-follow')).toBeVisible();
  await expect.poll(() => reader.evaluate((element) => ({
    horizontal: element.scrollWidth > element.clientWidth,
    atEnd: Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 2,
  }))).toEqual({ horizontal: false, atEnd: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.locator('.recording-follow').click();
  const result = await new AxeBuilder({ page }).include('#phone-demo').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await expect(reader).not.toHaveAttribute('aria-live', 'polite');
  await expect(reader).not.toHaveAttribute('aria-live', 'assertive');
});

test('the complete supplied transcript is readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/#phone-demo');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.transcript-cue')).toHaveCount(transcript.length);
  await expect(page.locator('.recording-transcript')).toContainText('תודה שפניתם לתריס מאסטר.');
  await expect(page.locator('#demo-call-audio')).toBeVisible();
  await expect(page.locator('.transcript-follow-row')).toBeHidden();
  const reader = page.locator('.recording-transcript');
  expect(await reader.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    const last = element.querySelector('.transcript-cue:last-child')!.getBoundingClientRect();
    return last.bottom <= element.getBoundingClientRect().bottom;
  })).toBe(true);
  await context.close();
});
