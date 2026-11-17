import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:4321',
    browserName: 'chromium',
    channel: 'msedge',
    headless: true,
    locale: 'he-IL',
    trace: 'retain-on-failure',
  },
});
