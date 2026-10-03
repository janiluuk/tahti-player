import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Every story runs as a render smoke test plus its `play` function, in
// headless Chromium.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: fileURLToPath(new URL('./.storybook', import.meta.url)),
          }),
        ],
        test: {
          name: 'storybook',
          // CI runners have a small /dev/shm and ~7GB RAM; with one page per
          // CPU, Chromium's renderer got killed mid-run ("Browser connection
          // was closed"). Use regular memory for shared buffers and cap the
          // number of story files running at once there.
          maxWorkers: process.env.CI ? 2 : undefined,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { args: ['--disable-dev-shm-usage'] },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
