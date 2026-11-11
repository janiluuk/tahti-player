import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test('an artist drafts an event, previews it, tags someone and publishes it', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/events/new');
  await page
    .getByRole('textbox', { name: 'Title' })
    .fill('Rooftop closing set');
  await page.getByRole('textbox', { name: 'Place' }).fill('Kaiku');
  await page.getByRole('textbox', { name: 'Location' }).fill('Helsinki');
  await page.getByLabel('Start').fill('2030-06-21T20:00');
  await page.getByLabel('End (optional)').fill('2030-06-21T19:00');
  await expect(page.getByText('End must be after the start.')).toBeVisible();
  await page.getByLabel('End (optional)').fill('2030-06-22T02:00');

  await page.getByRole('button', { name: 'Preview' }).click();
  const preview = page.getByTestId('event-preview');
  await expect(preview.getByText('Rooftop closing set')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).last().click();

  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page).toHaveURL(/\/studio\/events$/);
  const row = page
    .getByRole('listitem')
    .filter({ hasText: 'Rooftop closing set' });
  await expect(row.getByText('Draft')).toBeVisible();
  await row
    .getByRole('link', { name: 'Rooftop closing set', exact: true })
    .click();

  await page.getByRole('button', { name: 'Tag someone' }).click();
  await page.getByLabel('Tag someone').fill('northern');
  await page.getByRole('button', { name: /Northern Signals/ }).click();
  await page.getByRole('button', { name: 'Save tags' }).click();
  await expect(page.getByTestId('event-participants')).toHaveCount(0);
  await expect(page.getByText('Pending').first()).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish' })
    .click();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cancel event' }),
  ).toBeVisible();
});

test('the Feed calendar lists events and opens the event page', async ({
  page,
}) => {
  await page.goto('/discover?tab=feed&view=calendar');
  await expect(page.getByTestId('event-calendar')).toBeVisible();
  await page.getByRole('radio', { name: 'List' }).click();
  const agenda = page.getByTestId('event-agenda');
  await expect(agenda).toBeVisible();
  await agenda.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/events\//);
  await expect(page.getByTestId('event-page')).toBeVisible();
  await expect(
    page
      .getByRole('link', { name: /Add to Google Calendar|Subscribe/ })
      .first(),
  ).toBeVisible();
});

test('an artist answers an event invite from Studio Events', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/schedule?show=events');
  await page.getByRole('tab', { name: 'Invites' }).click();
  await expect(page.getByText('Kaiku Collective night')).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByText('Accepted', { exact: true })).toBeVisible();
});
