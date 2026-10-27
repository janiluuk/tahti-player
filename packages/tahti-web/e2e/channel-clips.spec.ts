import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test.use({
  launchOptions: {
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_PATH ??
      [
        '/Users/jani/Library/Caches/ms-playwright/chromium_headless_shell-1243/',
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
      ].join(''),
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  },
});

test('24/7 clip editor previews, activates, and deletes clips with Studio chrome mounted', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/channel?tab=announcements');
  await expect(page.getByTestId('studio-navigation')).toBeVisible();
  await expect(
    page.getByRole('tab', { name: '24/7', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  const section = page.locator('#channel-clips');
  await section
    .getByRole('button', { name: 'Edit', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Edit clip' });
  await expect(dialog.getByLabel('Clip title')).toHaveValue('Station ident');
  await dialog
    .getByRole('button', { name: 'Natural voice', exact: true })
    .click();
  await expect(
    dialog.getByRole('button', { name: 'Save & activate' }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Generate preview' }).click();
  await expect(
    dialog.getByText('Preview ready. Listen to Processed, then save.'),
  ).toBeVisible();
  await page.screenshot({
    path: '/private/tmp/clip-editor-desktop.png',
    fullPage: true,
  });
  await dialog.getByRole('button', { name: 'Save & activate' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('studio-navigation')).toBeVisible();
  await section.getByRole('button', { name: 'Delete Station ident' }).click();
  const deletion = page.getByRole('dialog', {
    name: 'Delete “Station ident”?',
  });
  await deletion.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(section.getByText('No announcement clips yet')).toBeVisible();
});

test('records voice as WAV and opens the take as an inactive clip', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/channel?tab=rotation');
  const section = page.locator('#channel-clips');
  await section
    .getByRole('button', { name: 'Record voice', exact: true })
    .click();
  await section
    .getByRole('button', { name: 'Record voice', exact: true })
    .click();
  await expect(section.getByText(/[12] s · recording WAV/)).toBeVisible();
  await section.getByRole('button', { name: 'Stop recording' }).click();
  await expect(section.getByLabel('Recorded voice preview')).toBeVisible();
  await section.getByRole('button', { name: 'Use recording' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit clip' });
  await expect(dialog.getByLabel('Clip title')).toHaveValue('Voice clip');
  await dialog.getByRole('button', { name: 'Generate preview' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Save inactive' }),
  ).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save inactive' }).click();
  await expect(dialog).toBeHidden();
  await expect(section.getByText('Voice clip', { exact: true })).toBeVisible();
  await expect(
    section.getByRole('switch', { name: 'Enable Voice clip' }),
  ).not.toBeChecked();
});
