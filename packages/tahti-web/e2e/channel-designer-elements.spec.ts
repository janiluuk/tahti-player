import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

async function openChannelDesigner(page: import('@playwright/test').Page) {
  await page.goto('/studio/profile/appearance');
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
  await acknowledgeGuidelines(page);
  await expect(
    page.getByRole('button', { name: 'Acknowledge', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath('channel-designer-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('channel-designer-mobile.png'),
    fullPage: true,
  });
});

test('a hidden artist page block stays hidden without this browser’s copy', async ({
  page,
  baseURL,
}) => {
  // Hiding a block saves it on the channel; against a deployed host that
  // would change the shared e2e account's real artist page.
  test.skip(
    !['localhost', '127.0.0.1'].includes(
      new URL(baseURL ?? 'http://x').hostname,
    ),
    'Requires the local mock app on localhost or 127.0.0.1',
  );
  await signIn(page);
  await page.goto('/u/artist');
  await expect(page.getByRole('button', { name: /full bio/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Design' }).click();
  const editor = page.getByTestId('channel-element-editor');
  await editor.getByRole('button', { name: 'Section', exact: true }).click();
  await page.getByRole('option', { name: 'Bio & widgets' }).click();
  await editor.getByRole('button', { name: 'Hide Bio & widgets' }).click();
  await expect(page.getByRole('button', { name: /full bio/ })).toHaveCount(0);

  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('tahti.artistLookBlocks.')) {
        localStorage.removeItem(key);
      }
    }
  });
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Design' })).toBeVisible();
  await expect(page.getByRole('button', { name: /full bio/ })).toHaveCount(0);
});
