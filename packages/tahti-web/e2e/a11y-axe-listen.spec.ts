import { test } from '@playwright/test';

import { signInAsListener } from './helpers/auth';
import {
  AXE_VIEWPORTS,
  expectNoSeriousAxeViolations,
  settle,
} from './helpers/axe';

const PERSONAS = {
  anonymous: async () => undefined,
  listener: signInAsListener,
} as const;

for (const [viewportName, viewport] of Object.entries(AXE_VIEWPORTS)) {
  for (const [persona, signInAs] of Object.entries(PERSONAS)) {
    test(`listen / has no serious axe violations (${persona}, ${viewportName})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await signInAs(page);
      await page.goto('/');
      await settle(page);
      await expectNoSeriousAxeViolations(page);
    });
  }
}
