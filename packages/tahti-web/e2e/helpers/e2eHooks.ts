import type { Page } from '@playwright/test';

import type { TahtiE2eHooks } from '../../src/e2e/testHooks';

export type { TahtiE2eHooks };

/** Resolves once the app has installed `window.__tahtiE2e` (dev server or
 * the e2e-mock bundle). */
export async function waitForE2eHooks(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as { __tahtiE2e?: unknown }).__tahtiE2e !== undefined,
  );
}
