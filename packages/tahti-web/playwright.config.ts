import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // CI serves the app from the Vite dev server, which compiles each route on
  // first visit; a sign-in plus a few cold routes can use most of 30 s there.
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
