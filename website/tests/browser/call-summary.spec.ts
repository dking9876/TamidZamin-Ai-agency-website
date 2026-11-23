import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.route('**/*', (route) => new URL(route.request().url()).origin === origin
    && route.request().method() === 'GET' ? route.continue() : route.abort('blockedbyclient'));
});

async function finishCall(page: Page) {
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await page.locator('.recording-seek').fill('134.9');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'ended');
  await expect(page.locator('.recording-summary')).toBeVisible();
}

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`actual call completion at ${width}px shows the owner receipt without resizing either phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#phone-demo');
    await page.evaluate(() => document.fonts.ready);
    const summary = page.getByRole('region', { name: 'הסיכום בוואטסאפ של בעל העסק' });
    const phone = page.locator('.recording-phone');
    const original = (await phone.boundingBox())!;
    await expect(summary).toBeHidden();
    await finishCall(page);
    await expect(phone).toHaveAttribute('data-view', 'summary');
    await expect(page.locator('.recording-transcript')).toBeHidden();
    await expect(summary.locator('dl > div')).toHaveCount(6);
    await expect(summary).toContainText('בקשה חדשה לביקור טכנאי');
    await expect(summary).toContainText('דניאל ויצר');
    await expect(summary).toContainText('05X-XXX-XXXX');
    await expect(summary).toContainText('תל אביב, שלמה 18, בית פרטי');
    await expect(summary).toContainText('דחוף — אין אפשרות לצאת החוצה');
    await expect(summary).toContainText('19.11.2026, כל היום');
    await expect(summary).toContainText('ממתינה לאישור הצוות');
    expect((await summary.innerText()).match(/0\d{8,9}/g)).toBeNull();
    const ended = (await phone.boundingBox())!;
    const whatsapp = (await page.locator('.whatsapp-phone').boundingBox())!;
    expect(ended.width).toBe(original.width);
    expect(ended.height).toBe(original.height);
    expect(Math.abs(ended.width - whatsapp.width)).toBeLessThan(1);
    expect(Math.abs(ended.height - whatsapp.height)).toBeLessThan(1);
    expect(await summary.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
    const listen = summary.getByRole('button', { name: 'האזנה להקלטת השיחה' });
    await listen.click();
    await expect(phone).toHaveAttribute('data-state', 'playing');
    await expect(summary).toBeHidden();
    await expect(page.locator('.recording-transcript')).toBeVisible();
    await expect(page.locator('.recording-toggle')).toBeFocused();
    expect(await page.locator('#demo-call-audio').evaluate((media: HTMLMediaElement) => media.currentTime)).toBeLessThan(3);
    await page.locator('.recording-toggle').click();
  });
}

test('a paused recording never shows a receipt early; ending and backward seek preserve keyboard context', async ({ page }) => {
  await page.goto('/#phone-demo');
  await page.locator('.recording-toggle').click();
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-state', 'playing');
  await page.locator('.recording-toggle').click();
  await page.locator('.recording-seek').fill('134.9');
  await expect(page.locator('.recording-summary')).toBeHidden();
  await page.locator('.recording-transcript').focus();
  await page.locator('.recording-toggle').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('.recording-summary')).toBeVisible();
  await expect(page.locator('.recording-summary')).toBeFocused();
  await expect(page.locator('.recording-summary-announcement')).toContainText('השיחה הסתיימה');
  await page.locator('.recording-seek').fill('24.9');
  await expect(page.locator('.recording-phone')).toHaveAttribute('data-view', 'call');
  await expect(page.locator('.recording-summary')).toBeHidden();
  await expect(page.locator('.transcript-cue[data-cue="10"]')).toHaveAttribute('aria-current', 'true');
});

test('the mobile receipt stays accessible at 200% text and explains WhatsApp without contacting a customer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#phone-demo');
  await finishCall(page);
  const summary = page.locator('.recording-summary');
  await summary.locator('.call-summary-contact > summary').click();
  await expect(summary.locator('.call-summary-contact')).toHaveAttribute('open', '');
  await expect(summary).toContainText('ללא קישור למספר אישי');
  await expect(summary.locator('a[href^="https://wa.me/"], a[href^="tel:"]')).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).include('#phone-demo').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await summary.focus();
  await page.keyboard.press('End');
  await expect.poll(() => summary.evaluate((element) => Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop))).toBeLessThan(2);
  expect(await summary.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const phone = (await page.locator('.recording-phone').boundingBox())!;
  const whatsapp = (await page.locator('.whatsapp-phone').boundingBox())!;
  expect(Math.abs(phone.height - whatsapp.height)).toBeLessThan(1);
  for (const selector of ['.call-summary-listen', '.call-summary-contact > summary']) {
    const bounds = (await summary.locator(selector).boundingBox())!;
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.x).toBeGreaterThanOrEqual(phone.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(phone.x + phone.width);
  }
});

test('the owner summary and actual recording remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  await page.goto('/#phone-demo');
  const fallback = page.locator('noscript .recording-summary-fallback');
  await fallback.locator(':scope > summary').click();
  await expect(fallback).toContainText('בקשה חדשה לביקור טכנאי');
  await expect(fallback.locator('a.call-summary-listen')).toHaveAttribute('href', '/media/demo-call.mp3');
  await expect(fallback.locator('button')).toHaveCount(0);
  await expect(page.locator('#demo-call-audio')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
