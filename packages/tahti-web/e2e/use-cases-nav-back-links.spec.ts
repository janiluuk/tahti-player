import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function back(
  page: Page,
  from: string,
  label: string,
  to: RegExp,
): Promise<void> {
  await page.goto(from);
  await acknowledgeGuidelines(page);
  const link = page
    .getByRole('main')
    .getByTestId('page-back-link')
    .filter({ hasText: label });
  await expect(link).toHaveAccessibleName(label);
  await link.click();
  await expect(page).toHaveURL(to);
}

test('Studio Insights leads back to Stats, not to itself', async ({ page }) => {
  const errors = collectPageErrors(page);
  await signIn(page);
  await back(page, '/studio/insights', 'Stats', /\/studio\/stats$/);
  await back(page, '/studio/stats/detail', 'Stats', /\/studio\/stats$/);
  expect(errors).toEqual([]);
});

test('governance meeting, motion, members and discussions lead back to Governance', async ({
  page,
}) => {
  await signIn(page);
  for (const from of [
    '/governance/meetings/meeting-agm-2026',
    '/governance/motions/motion-1',
    '/governance/members',
    '/governance/discussions',
  ]) {
    await back(page, from, 'Governance', /\/governance$/);
  }
});

test('a discussion topic leads back to Discussions', async ({ page }) => {
  await signIn(page);
  await back(
    page,
    '/governance/discussions/topic-fees-2026',
    'Discussions',
    /\/governance\/discussions$/,
  );
});

test('transparency resolutions and methodology lead back to Transparency', async ({
  page,
}) => {
  for (const from of [
    '/transparency/resolutions',
    '/transparency/methodology',
  ]) {
    await back(page, from, 'Transparency', /\/transparency$/);
  }
});

test('password pages lead back to Log in; verify has one Join link', async ({
  page,
}) => {
  for (const from of ['/forgot-password', '/reset-password?token=t']) {
    await back(page, from, 'Log in', /\/$/);
    await expect(
      page
        .getByRole('dialog', { name: 'Log in' })
        .getByRole('textbox', { name: 'Email' }),
    ).toBeVisible();
  }
  await page.goto('/verify');
  const join = page.getByRole('main').getByRole('link', { name: 'Join' });
  await expect(join).toHaveCount(1);
  await join.click();
  await expect(
    page.getByRole('dialog', { name: 'Join' }).getByLabel('Email'),
  ).toBeVisible();
});

test('subscribe and green room lead back to the artist', async ({ page }) => {
  await back(
    page,
    '/subscribe/northern-lights',
    '@northern-lights',
    /\/u\/northern-lights$/,
  );
  await back(
    page,
    '/u/northern-lights/green-room',
    '@northern-lights',
    /\/u\/northern-lights$/,
  );
});

test('venue register and a venue page lead back to All venues', async ({
  page,
}) => {
  await signIn(page);
  await back(page, '/venues/register', 'All venues', /\/discover\?tab=venues$/);
  await back(page, '/v/kuudes-linja', 'All venues', /\/discover\?tab=venues$/);
});

test('a radio show leads back to Radio', async ({ page }) => {
  await back(page, '/radio/show/northern-lights', 'Radio', /\/radio$/);
});

test('mastering and the pro editor lead straight to Library Sounds', async ({
  page,
}) => {
  await signIn(page);
  await back(
    page,
    '/studio/mastering/arch-mock-1',
    'Sounds',
    /\/library\/sounds$/,
  );
  await back(
    page,
    '/studio/sounds/arch-mock-1/editor',
    'Sounds',
    /\/library\/sounds$/,
  );
});

test('an editor project, distribution and track insights lead back to their list', async ({
  page,
}) => {
  await signIn(page);
  await back(page, '/studio/editor/proj-mock-1', 'Editor', /\/studio\/editor$/);
  await back(page, '/studio/distribution', 'Releases', /\/studio\/releases$/);
  await back(
    page,
    '/studio/insights/release-tracks/rt-1',
    'Releases',
    /\/studio\/releases$/,
  );
});
