import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Every story runs as a render smoke test plus its `play` function, in
// headless Chromium.
//
// Keep browser concurrency serial on CI: parallel Chromium tabs under
// @storybook/addon-vitest flake with "Browser connection was closed" /
// "[birpc] rpc is closed" (see vitest#7981 / #11051). maxWorkers must be set
// on the project config — the CLI flag is ignored for browser projects.
export default defineConfig({
  test: {
    // Root-level defaults also help when Vitest merges project config.
    retry: process.env.CI ? 2 : 0,
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
          maxWorkers: 1,
          fileParallelism: false,
          retry: process.env.CI ? 2 : 0,
          browser: {
            enabled: true,
            headless: true,
            // Serialize files across one Chromium instance in CI.
            fileParallelism: false,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
