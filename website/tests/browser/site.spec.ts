import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const paths = ['/', '/services/', '/services/whatsapp/', '/services/phone/', '/about/', '/faq/', '/contact/', '/privacy/', '/accessibility/'];

test('all pages: real HTTP, Hebrew semantics, unique SEO and accessible content', async ({ page, request }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(titles.has(title)).toBe(false);
    expect(descriptions.has(description!)).toBe(false);
    titles.add(title); descriptions.add(description!);
    expect(description!.length).toBeGreaterThan(40);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(new URL(path, process.env.TEST_SITE_ORIGIN || 'http://localhost:4321').href);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(audit.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })), path).toEqual([]);
    const anchors = await page.locator('a[href^="/"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute('href')!))]);
    for (const href of anchors) {
      expect((await request.get(href)).status(), `${path} -> ${href}`).toBe(200);
      if (href.includes('#')) {
        const hash = href.split('#')[1];
        const linked = await request.get(href.split('#')[0]);
        expect(await linked.text()).toContain(`id="${hash}"`);
      }
    }
  }
});

test('mobile navigation, Escape, FAQ keyboard and skip link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('.mobile-menu > summary');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('.mobile-menu a[href="/faq/"]').click();
  await expect(page).toHaveURL(/\/faq\/$/);
  const question = page.locator('.faq-list summary').first();
  await question.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open', '');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('responsive layouts, all loaded images, no horizontal clipping', async ({ page }) => {
  for (const width of [320, 390, 680, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/services/', '/contact/']) {
      await page.goto(path);
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach((image) => { image.loading = 'eager'; });
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}`).toBe(true);
      expect(await page.locator('img').evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    }
  }
});

test('404 and unpublished crawler safeguards', async ({ page, request }) => {
  const response = await page.goto('/not-a-real-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('לא זמין');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('<loc>');
  await page.goto('/contact/');
  await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
  await expect(page.locator('#submit-lead')).toBeDisabled();
  await expect(page.getByText('טופס הפניות עדיין לא מחובר.')).toBeVisible();
  expect((await request.post('/api/lead', { form: {} })).ok()).toBe(false);
});

test('essential pages work without JavaScript; 200% text and reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/faq/');
  await page.locator('.faq-list summary').first().click();
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
