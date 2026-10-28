import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

async function openChannelDesigner(page: import('@playwright/test').Page) {
  await page.goto('/settings/channel');
  const editor = page.getByTestId('channel-element-editor');
  await expect(editor).toBeVisible();
  return editor;
}

test('studio branding designer lists usable artist-page blocks', async ({
  page,
}) => {
  await signIn(page);
  const editor = await openChannelDesigner(page);
  await editor.getByRole('button', { name: 'Section', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Releases' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Tracks' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Latest' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Feed' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'News' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Player' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Background' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Header' })).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Actions' })).toHaveCount(0);
});

test('artist page designer uses the element menu', async ({ page }) => {
  await signIn(page);
  await page.goto('/u/artist');
  await page.getByRole('tab', { name: 'Design' }).click();
  const editor = page.getByTestId('channel-element-editor');
  await expect(editor).toBeVisible();
  await expect(page.getByText('Channel appearance')).toHaveCount(0);
  await editor.getByRole('button', { name: 'Section', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Player' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Background' })).toBeVisible();
});

test('channel editor keeps appearance drafts across panels and reverts unsaved changes', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/channel/artist?edit=true');
  const menu = page.getByTestId('channel-layers-menu');
  await expect(menu).toBeVisible();
  await menu.getByRole('button', { name: /Background Banner/ }).click();
  const topBar = menu.getByRole('textbox', { name: 'Top bar text' });
  const savedText = await topBar.inputValue();
  await topBar.fill('Draft banner');
  await menu.getByRole('button', { name: 'Layers', exact: true }).click();
  await menu.getByRole('button', { name: 'compact width for Tracks' }).click();
  await menu.getByRole('button', { name: /^Links Social/ }).click();
  await menu.getByRole('button', { name: 'Layers', exact: true }).click();
  await menu.getByRole('button', { name: /Background Banner/ }).click();
  await expect(topBar).toHaveValue('Draft banner');
  await page
    .getByRole('button', { name: 'Revert changes', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Save changes', exact: true }),
  ).toBeDisabled();
  await expect(topBar).toHaveValue(savedText);
  await menu.getByRole('button', { name: 'Layers', exact: true }).click();
  await expect(
    menu.getByRole('button', { name: 'full width for Tracks' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await menu.getByRole('button', { name: /Background Banner/ }).click();
  await menu.getByRole('button', { name: 'Section', exact: true }).click();
  await page.getByRole('option', { name: 'Player', exact: true }).click();
  await expect(
    menu.getByText('Editing Live stage', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Editing', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Acknowledge', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: '/private/tmp/channel-designer-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toBeVisible();
  await page.screenshot({
    path: '/private/tmp/channel-designer-mobile.png',
    fullPage: true,
  });
});
