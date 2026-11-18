import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes, serviceLinks, utilityLinks } from '../../src/lib/navigation';

test.use({ reducedMotion: 'reduce' });

async function openNavigationFor(page: Page, href: string, mobile: boolean) {
  if (mobile) {
    await page.locator('.mobile-menu > summary').click();
  } else if (serviceLinks.some((link) => link.href === href)) {
    await page.locator('.solutions-menu > summary').click();
  } else if (utilityLinks.some((link) => link.href === href)) {
    await page.locator('.utility-menu > summary').click();
  }
}

for (const width of [390, 881, 1440]) {
  test(`${width}px: every public page is reachable from the header and footer, with current-page feedback`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const mobile = width <= 880;
    for (const { href } of routes) {
      await openNavigationFor(page, href, mobile);
      const link = !mobile && href === '/contact/'
        ? page.locator('.header-cta')
        : page.locator(`${mobile ? '.mobile-menu' : '.desktop-nav'} a[href="${href}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL((url) => url.pathname === href);
      await expect(page.locator('.site-footer nav a')).toHaveCount(routes.length);
      await expect(page.locator(`.site-footer nav a[href="${href}"]`)).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('.site-footer nav a[aria-current="page"]')).toHaveCount(1);
      await openNavigationFor(page, href, mobile);
      await expect(link).toHaveAttribute('aria-current', 'page');
      if (!mobile && href.startsWith('/services/')) {
        await expect(page.locator('.solutions-menu > summary')).toHaveAttribute('data-current', 'true');
      }
      if (!mobile && utilityLinks.some((item) => item.href === href)) {
        await expect(page.locator('.utility-menu > summary')).toHaveAttribute('data-current', 'true');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Escape');
    }
  });
}

test('desktop disclosures support keyboard, exclusive opening, Escape, outside click and focus leaving', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/services/whatsapp/');
  const solutions = page.locator('.solutions-menu');
  const summary = solutions.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(solutions).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(page.locator('.nav-services a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(solutions).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Space');
  await page.locator('.utility-menu > summary').click();
  await expect(solutions).not.toHaveAttribute('open', '');
  await expect(page.locator('.utility-menu')).toHaveAttribute('open', '');
  await page.locator('h1').click();
  await expect(page.locator('.utility-menu')).not.toHaveAttribute('open', '');
  await summary.click();
  await page.locator('.header-cta').focus();
  await expect(solutions).not.toHaveAttribute('open', '');
});

test('breakpoint changes close hidden menus instead of reopening stale state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-menu > summary').click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
  await page.locator('.solutions-menu > summary').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.solutions-menu')).not.toHaveAttribute('open', '');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
});

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 900 },
  { width: 880, height: 390 }, { width: 881, height: 900 }, { width: 1024, height: 768 },
  { width: 1440, height: 900 }, { width: 1920, height: 1080 },
]) {
  test(`${viewport.width}x${viewport.height}: open menus fit the viewport, including enlarged text`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.goto('/services/');
    await page.evaluate(() => document.fonts.ready);
    const mobile = viewport.width <= 880;
    const menus = mobile
      ? [{ toggle: '.mobile-menu > summary', panel: '.mobile-menu nav' }]
      : [{ toggle: '.solutions-menu > summary', panel: '.solutions-panel' }, { toggle: '.utility-menu > summary', panel: '.utility-panel' }];
    for (const enlarged of [false, true]) {
      if (enlarged) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      for (const menu of menus) {
        await page.locator(menu.toggle).click();
        const panel = page.locator(menu.panel);
        await expect(panel).toBeVisible();
        await expect.poll(async () => panel.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight + 1;
        })).toBe(true);
        expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        for (const link of await panel.locator('a').all()) {
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        }
        await panel.locator('a').last().scrollIntoViewIfNeeded();
        await expect(panel.locator('a').last()).toBeInViewport();
        await page.keyboard.press('Escape');
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.locator(menus[0].toggle).click();
    await info.attach('open-navigation', { body: await page.screenshot(), contentType: 'image/png' });
  });
}

test('open desktop and mobile menus pass accessibility checks', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/services/whatsapp/');
    const toggles = width <= 880 ? ['.mobile-menu > summary'] : ['.solutions-menu > summary', '.utility-menu > summary'];
    for (const toggle of toggles) {
      await page.locator(toggle).click();
      await page.evaluate(() => document.fonts.ready);
      const audit = await new AxeBuilder({ page }).include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
});

test('all page links remain available without JavaScript', async ({ browser, baseURL }) => {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      const page = await context.newPage();
      for (const { href } of routes) {
        await page.goto('/');
        await openNavigationFor(page, href, width <= 880);
        const selector = width > 880 && href === '/contact/'
          ? '.header-cta'
          : `${width <= 880 ? '.mobile-menu' : '.desktop-nav'} a[href="${href}"]`;
        await page.locator(selector).click();
        await expect(page).toHaveURL((url) => url.pathname === href);
      }
    } finally {
      await context.close();
    }
  }
});
