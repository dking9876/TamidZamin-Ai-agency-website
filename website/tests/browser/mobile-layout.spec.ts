import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const width of [320, 360, 390, 430, 600, 601, 768, 880, 881]) {
  test(`mobile layout at ${width}px: readable, grouped demos and usable section controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      };
      const articles = [...document.querySelectorAll('.home-channel')].map((article) => ({
        children: [...article.children].map((child) => child.tagName),
        title: box(article.querySelector('h2')!),
        demo: box(article.querySelector('figure')!),
        device: box(article.querySelector('.phone-shell')!),
        features: box(article.querySelector('ul')!),
        action: box(article.querySelector('a')!),
      }));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        articles,
        demoFontSizes: [...document.querySelectorAll('.bubble, .chat-summary, .phone-top, .voice-phone > p, .voice-phone > strong')]
          .map((element) => parseFloat(getComputedStyle(element).fontSize)),
        controls: [...document.querySelectorAll('main a, main summary, .site-footer a, .mobile-menu > summary')]
          .filter((element) => element.getClientRects().length > 0)
          .map((element) => ({ text: element.textContent?.trim(), ...box(element) })),
        benefits: [...document.querySelectorAll('.benefits-strip li')].map(box),
        human: {
          intro: box(document.querySelector('.human-intro')!),
          photo: box(document.querySelector('.human-strip > img')!),
        },
        about: {
          values: box(document.querySelector('.about-strip > ul')!),
          photo: box(document.querySelector('.about-photo')!),
        },
        heroActions: [...document.querySelectorAll('.hero-actions a')].map(box),
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(width);
    expect(layout.articles).toHaveLength(2);
    for (const article of layout.articles) {
      expect(article.children).toEqual(['H2', 'FIGURE', 'UL', 'A']);
      expect(article.device.left).toBeGreaterThanOrEqual(0);
      expect(article.device.right).toBeLessThanOrEqual(width);
      if (width <= 880) {
        expect(article.device.width).toBeGreaterThanOrEqual(240);
        expect(article.title.bottom).toBeLessThanOrEqual(article.demo.top);
        expect(article.demo.bottom).toBeLessThanOrEqual(article.features.top);
        expect(article.features.bottom).toBeLessThanOrEqual(article.action.top);
      }
    }
    if (width <= 880) {
      expect(Math.min(...layout.demoFontSizes)).toBeGreaterThanOrEqual(14);
    }
    for (const control of layout.controls) {
      expect(control.height, control.text).toBeGreaterThanOrEqual(44);
      expect(control.left, control.text).toBeGreaterThanOrEqual(-1);
      expect(control.right, control.text).toBeLessThanOrEqual(width + 1);
    }
    if (width <= 600) {
      expect(layout.articles[0].action.bottom).toBeLessThan(layout.articles[1].title.top);
      expect(layout.human.intro.bottom).toBeLessThan(layout.human.photo.top);
      expect(layout.about.values.bottom).toBeLessThan(layout.about.photo.top);
      for (let index = 1; index < layout.benefits.length; index++) {
        expect(layout.benefits[index].top).toBeGreaterThan(layout.benefits[index - 1].bottom);
        expect(layout.benefits[index].left).toBeCloseTo(layout.benefits[0].left, 0);
      }
      expect(layout.heroActions[0].width).toBeGreaterThan(layout.heroActions[1].width + 80);
      expect(layout.heroActions[0].height).toBeGreaterThan(layout.heroActions[1].height);
      await expect(page.locator('.hero-points')).toBeHidden();
      await expect(page.locator('.home-hero .scroll-cue')).toBeHidden();
    } else if (width <= 880) {
      expect(layout.articles[0].demo.top).toBeCloseTo(layout.articles[1].demo.top, 0);
      expect(layout.articles[0].action.top).toBeCloseTo(layout.articles[1].action.top, 0);
    }

    const actions = page.locator('.home-channel > a');
    await actions.first().focus();
    await page.keyboard.press('Tab');
    await expect(actions.last()).toBeFocused();
    await expect(actions.first()).toHaveAttribute('href', '/services/whatsapp/');
    await expect(actions.last()).toHaveAttribute('href', '/services/phone/');
    await expect(page.locator('.home-channel figure figcaption')).toHaveCount(2);
  });
}

test('mobile demo text grows at 200% without device clipping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.style.fontSize = '200%';
  });
  const devices = await page.locator('.phone-shell').evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const clipped: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.left < bounds.left || rect.right > bounds.right || rect.top < bounds.top || rect.bottom > bounds.bottom) {
          clipped.push(node.textContent);
        }
      }
    }
    return { clipped, height: bounds.height };
  }));
  for (const device of devices) {
    expect(device.clipped).toEqual([]);
    expect(device.height).toBeGreaterThanOrEqual(768);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
