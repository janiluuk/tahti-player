import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines } from './helpers/auth';

test('visitor: Live & replays lists only the replay channel that is airing a track', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await acknowledgeGuidelines(page);

  const row = page.getByTestId('listen-on-air').first();
  const playable = row.getByTestId('card').filter({ hasText: 'Tundra Static' });
  await expect(playable).toBeVisible();
  await expect(playable.getByText('Replay')).toBeVisible();
  await expect(row.getByText('Northern Lights')).toBeVisible();
  await expect(row.getByText('Metsänpeitto')).toHaveCount(0);
});
