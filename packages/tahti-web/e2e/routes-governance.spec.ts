import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const memberRoutes: RouteVisit[] = [
  { path: '/governance', heading: /^Governance$/ },
  { path: '/governance/members', heading: 'Member directory' },
  {
    path: '/governance/meetings/meeting-agm-2026',
    heading: '2026 Annual General Meeting',
  },
  {
    path: '/governance/motions/motion-1',
    heading: 'Approve 2026 grant formula',
  },
  { path: '/governance/history', heading: 'Governance history' },
  { path: '/governance/feature-requests', heading: 'Feature requests' },
];

test('member governance pages render for a signed-in member', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);

  for (const route of memberRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});

test('governance overview links reach a meeting and a motion', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);
  await expectRouteHealthy(page, errors, memberRoutes[0]!);

  await page
    .getByRole('link', { name: /2026 Annual General Meeting/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/governance\/meetings\/meeting-agm-2026$/);
  await expect(
    page.getByRole('heading', { name: '2026 Annual General Meeting' }).first(),
  ).toBeVisible();

  await page.goBack();
  await page
    .getByRole('link', { name: /Approve 2026 grant formula/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/governance\/motions\/motion-1$/);
  await expect(
    page.getByRole('heading', { name: 'Approve 2026 grant formula' }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('public governance history renders for a signed-out visitor', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/governance/history',
    heading: 'Governance history',
  });
});
