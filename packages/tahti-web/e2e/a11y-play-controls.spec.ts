import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test('artwork Play buttons can be reached and used from the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/library/sounds');
  await acknowledgeGuidelines(page);
  const play = page
    .getByRole('main')
    .getByRole('button', { name: /^Play Studio sketch A/ });
  await play.focus();
  await expect(play).toBeFocused();
  await expect(play).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Studio sketch A',
  );
});
