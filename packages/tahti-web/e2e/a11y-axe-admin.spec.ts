import { test } from '@playwright/test';

import { signInAsBoard } from './helpers/auth';
import {
  AXE_VIEWPORTS,
  expectNoSeriousAxeViolations,
  settle,
} from './helpers/axe';

const ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/moderation',
  '/admin/governance',
] as const;

for (const [viewportName, viewport] of Object.entries(AXE_VIEWPORTS)) {
  for (const route of ROUTES) {
    test(`admin ${route} has no serious axe violations (${viewportName})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await signInAsBoard(page);
      await page.goto(route);
      await settle(page);
      await expectNoSeriousAxeViolations(page);
    });
  }
}
