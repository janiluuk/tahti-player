import { expect, test, type Page } from '@playwright/test';

import {
  acknowledgeGuidelines,
  signIn,
  signInAsBoard,
  signInAsListener,
} from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('listener: joins a live listening party and the player starts', async ({
  page,
}) => {
  await signInAsListener(page);
  await open(page, '/party/lp-mock-live');
  await page.getByRole('button', { name: 'Join the party' }).click();
  await expect(page.getByTestId('now-playing-title')).not.toBeEmpty();
});

test('listener: a scheduled party offers to join at the start', async ({
  page,
}) => {
  await signInAsListener(page);
  await open(page, '/party/lp-mock-scheduled');
  await expect(
    page.getByRole('button', { name: 'Join at the start' }),
  ).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('artist: adds a chat moderator and removes one', async ({ page }) => {
  await signIn(page);
  await open(page, '/studio/fans');
  const chat = page.getByTestId('fans-chat-settings');
  const add = chat.getByRole('button', { name: 'Add moderator' });
  await expect(add).toBeDisabled();
  await chat.getByRole('textbox', { name: 'Username' }).fill('listener-one');
  await expect(add).toBeEnabled();
  await add.click();
  await expect(
    chat.getByRole('button', { name: /^Remove .* as moderator$/ }),
  ).not.toHaveCount(0);
  const removeAda = chat.getByRole('button', {
    name: 'Remove Ada Mod as moderator',
  });
  await removeAda.click();
  const confirm = page.getByRole('button', { name: /^(Remove|Confirm)$/ });
  if (await confirm.isVisible()) {
    await confirm.click();
  }
  await expect(removeAda).toHaveCount(0);
});

test('admin: changes the role picked for a user', async ({ page }) => {
  await signInAsBoard(page);
  await open(page, '/admin/users');
  const main = page.getByRole('main');
  await main.getByRole('radio', { name: /^DJ Moonlight/ }).click();
  const radio = main.getByRole('radio', { name: 'Radio', exact: true });
  await radio.click();
  await expect(radio).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
