import { test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  AXE_VIEWPORTS,
  expectNoSeriousAxeViolations,
  settle,
} from './helpers/axe';

const ROUTES = [
  '/library',
  '/library/playlists',
  '/library/favorites',
  '/library/history',
  '/library/following',
] as const;

for (const [viewportName, viewport] of Object.entries(AXE_VIEWPORTS)) {
  for (const route of ROUTES) {
    test(`library ${route} has no serious axe violations (${viewportName})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await signIn(page);
      await page.goto(route);
      await settle(page);
      await expectNoSeriousAxeViolations(page);
    });
  }
}
