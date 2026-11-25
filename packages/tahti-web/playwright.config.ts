import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // CI runners are several times slower than a dev machine, and the longest
  // journeys (sign-in plus several routes) take over 10 s locally.
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://beta.tahti.live',
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/bin/chromium',
    },
  },
});
