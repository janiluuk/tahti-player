import { expect, test } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill('artist@tahti.live');
  await page.getByLabel('Password').fill('demo-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

test('legacy callbacks land on the matching SPA surface', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard?membership=success');
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();

  await page.goto('/dashboard?fanConnect=return');
  await expect(page).toHaveURL(/\/studio\/revenue\?fanConnect=return$/);

  await page.goto('/dashboard/upload/import/soundcloud?sc=connected');
  await expect(page.getByText('SoundCloud connected.')).toBeVisible();
  await expect(page).toHaveURL(/\/sources\/soundcloud$/);
});

test('registration asks for an artist name and matching passwords', async ({
  page,
}) => {
  await page.goto('/join');

  await expect(page.getByLabel('Artist name')).toBeVisible();
  await expect(page.getByLabel('Verification token')).toHaveCount(0);
  await page.getByLabel('Email').fill('new-artist@tahti.live');
  await page.getByLabel('Username').fill('new-artist');
  await page.getByLabel('Artist name').fill('New Artist');
  await page.getByLabel('Password', { exact: true }).fill('secure-password');
  await page.getByLabel('Confirm password').fill('different-password');
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create account' }),
  ).toBeDisabled();

  await page.getByLabel('Confirm password').fill('secure-password');
  await expect(page.getByText('Passwords do not match.')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Create account' }),
  ).toBeEnabled();
});

test('artist can sign in and reach broadcast and upload tools', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/studio/go-live');
  await expect(page.getByRole('heading', { name: 'Go Live' })).toBeVisible();
  const recordingToggle = page.getByRole('switch', {
    name: 'Record broadcast',
  });
  await expect(recordingToggle).toHaveAttribute('aria-checked', 'true');
  await recordingToggle.click();
  await page.reload();
  await expect(recordingToggle).toHaveAttribute('aria-checked', 'false');
  await expect(
    page.getByRole('link', { name: 'Open recordings' }),
  ).toBeVisible();

  await page.goto('/studio/upload');
  await expect(page.getByRole('heading', { name: 'Upload' })).toBeVisible();
  await page.getByLabel('Audio file').setInputFiles({
    name: 'cutover-smoke.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('cutover-smoke'),
  });
  await page.getByRole('button', { name: 'Upload' }).click();
  await expect(
    page.getByText('Upload complete — processing may take a minute.'),
  ).toBeVisible();
});

test('studio dashboard shows clickable summary stats and compact broadcast actions', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio');

  await expect(
    page.getByRole('heading', {
      name: /Good (morning|afternoon|evening), artist/i,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole('region', { name: 'Channel summary' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '12,890 total plays' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '910 total downloads' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '284 followers' })).toBeVisible();
  await page.getByRole('button', { name: 'Studio tools', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Studio tool groups' })
      .getByRole('heading', { name: 'Music' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recordings' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Studio' })
      .getByRole('link', { name: 'Releases' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Member content' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Green room' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Stash' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Exclusive shows' }),
  ).toBeVisible();

  const goLiveCard = page.getByTestId('compact-broadcast-card').first();
  expect((await goLiveCard.boundingBox())!.height).toBeLessThan(140);
  await page.getByRole('link', { name: '12,890 total plays' }).click();
  await expect(page).toHaveURL(/\/studio\/stats$/);

  await page.goto('/studio/setup-channel');
  await expect(page).toHaveURL(/\/studio\/channel\?tab=setup$/);
  await expect(
    page.getByRole('heading', { name: 'Channel design' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Setup' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Design' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Channel setup' }),
  ).toBeVisible();
});

test('fan subscriptions show subscriber, revenue, and payout statistics', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/settings/money');
  await page.getByRole('tab', { name: 'Fan subs' }).click();

  const summary = page.getByRole('region', {
    name: 'Fan subscription summary',
  });
  await expect(
    summary.getByRole('group', { name: 'Active subscribers: 26' }),
  ).toBeVisible();
  await expect(
    summary.getByRole('group', { name: 'This month: €128.40' }),
  ).toBeVisible();
  await expect(
    summary.getByRole('group', { name: 'Paid out YTD: €842.10' }),
  ).toBeVisible();
  await expect(
    summary.getByRole('group', { name: 'Pending payouts: 1' }),
  ).toBeVisible();
  await expect(page.getByText('Paid in the last 30 days: 8')).toBeVisible();
  await expect(page.getByText('Supporter').first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Export subscribers' }),
  ).toBeVisible();
});

test('artist library starts with a searchable archive and track tools', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/library');

  await expect(page.getByRole('link', { name: 'All sounds' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('link', { name: 'Recordings' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Releases' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All sounds' })).toBeVisible();
  await expect(page.getByText('Northern Lights — Live Set')).toBeVisible();
  await expect(page.getByText('Studio sketch A')).toBeVisible();
  await expect(page.getByText('Pinned to profile')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pinned (1)' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Library' })
      .getByRole('link', { name: 'Messages' }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Releases' }).click();
  await expect(page).toHaveURL(/\/library\/releases$/);
  await expect(page.getByRole('heading', { name: 'Releases' })).toBeVisible();
  await page.getByRole('link', { name: 'All sounds' }).click();

  await page.getByPlaceholder('Search all sounds…').fill('Studio sketch');
  await expect(page.getByText('Northern Lights — Live Set')).not.toBeVisible();
  await page
    .getByRole('link', { name: 'Studio sketch A', exact: true })
    .click();

  await expect(page.getByRole('button', { name: 'Play track' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add to rotation' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
  await expect(page.getByLabel('Release date')).toBeVisible();
  await expect(page.getByLabel('Visibility')).toBeVisible();
  await expect(page.getByLabel('Allow downloads')).toBeVisible();
  await expect(page.getByLabel('Allow comments')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open audio editor' }),
  ).toBeVisible();
  await expect(page.getByLabel('Waveform preview')).toBeVisible();

  await page.getByRole('tab', { name: 'Playlists' }).click();
  await page.getByRole('button', { name: 'Choose playlists' }).click();
  await expect(page.getByRole('dialog')).toContainText('Add to playlist');
  await expect(
    page.getByRole('button', { name: /Favorites mix/ }),
  ).toBeVisible();
});

test('collections combine albums, EPs, DJ sets, and playlists', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/library/collections');

  await expect(page.getByRole('button', { name: /Albums/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /EPs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /DJ sets/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Playlists/ })).toBeVisible();
  await page.getByRole('button', { name: /Albums/ }).click();
  await expect(page.getByText('Midnight Archive')).toBeVisible();
  await page.getByRole('button', { name: /EPs/ }).click();
  await expect(page.getByText('Short Signals')).toBeVisible();
  await page.getByRole('button', { name: /DJ sets/ }).click();
  await expect(page.getByText('Northern Lights DJ set')).toBeVisible();
  await page.getByRole('button', { name: /Playlists/ }).click();
  await expect(page.getByText('Favorites mix')).toBeVisible();

  await page.goto('/studio/playlists/favorites-mix');
  const firstPlaylistRow = page.getByTestId('track-row').first();
  await firstPlaylistRow.hover();
  await firstPlaylistRow
    .getByRole('button', { name: /Play Northern Lights — Live Set/ })
    .click();
  await expect(firstPlaylistRow).toHaveAttribute('aria-current', 'true');
  await firstPlaylistRow.hover();
  await expect(
    firstPlaylistRow.getByRole('button', {
      name: /Pause Northern Lights — Live Set/,
    }),
  ).toBeVisible();

  await page.goto('/studio/collections/midnight-archive');
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page.getByLabel('Release date')).toBeVisible();
  await expect(page.getByLabel('Genres')).toBeVisible();
  await expect(page.getByLabel('Visibility')).toBeVisible();

  await page.goto('/studio/collections');
  await expect(
    page.getByRole('heading', { name: 'Collections' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'New collection' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Albums' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Playlists' })).toHaveCount(0);

  await page.goto('/studio/releases');
  await expect(page.getByRole('link', { name: 'Manage embeds' })).toBeVisible();

  await page.goto('/messages');
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
});

test('artist track titles open details while row controls handle playback and queueing', async ({
  page,
}) => {
  await page.goto('/u/northern-lights');

  const trackRow = page
    .getByTestId('track-row')
    .filter({ hasText: 'Midnight Broadcast' });
  await trackRow
    .getByRole('button', { name: 'Midnight Broadcast', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByText('Track info')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Midnight Broadcast');
  await page.getByTestId('dialog-close').click();

  await trackRow.hover();
  await trackRow
    .getByRole('button', { name: 'Play Midnight Broadcast' })
    .click();
  await expect(trackRow).toHaveAttribute('aria-current', 'true');
  await trackRow.hover();
  await expect(
    trackRow.getByRole('button', { name: 'Pause Midnight Broadcast' }),
  ).toBeVisible();
  await expect(
    trackRow.getByRole('button', { name: 'In queue' }),
  ).toBeDisabled();
});

test('free artist subscriptions accept listener accounts or a guest email', async ({
  page,
}) => {
  await page.goto('/u/northern-lights');
  await page.getByRole('button', { name: 'Subscribe free' }).click();
  await page.getByLabel('Email address').fill('listener@example.com');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await expect(page.getByText(/Check your email to confirm/)).toBeVisible();

  await signIn(page);
  await page.goto('/studio/channel?tab=profile');
  const subscriptionToggle = page.getByRole('switch', {
    name: 'Allow free subscriptions',
  });
  await expect(subscriptionToggle).toHaveAttribute('aria-checked', 'true');
  await subscriptionToggle.click();
  await expect(subscriptionToggle).toHaveAttribute('aria-checked', 'false');
  await subscriptionToggle.click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
});

test('queue actions show queued state and the player expands upward', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/radio');

  const queueButton = page.getByRole('button', { name: 'Queue', exact: true });
  await queueButton.click();
  await expect(
    page.getByRole('button', { name: 'In queue' }).first(),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Expand queue' }).click();
  await expect(page.getByTestId('bottom-queue')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Collapse queue' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear queue' })).toBeVisible();

  await page.getByRole('button', { name: 'Clear queue' }).click();
  await expect(page.getByText('Queue is empty')).toBeVisible();
});

test('Sources leaves broadcast captures to the recordings flow', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/sources');
  await expect(page.getByText('From broadcast')).toHaveCount(0);
});

test('hearthis imports report completion, link to the track, and prevent duplicates', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/sources/hearthis');

  const destination = page.getByLabel('Import destination playlist');
  await expect(destination).toBeVisible();
  await destination.selectOption('__new_playlist__');
  await page.getByLabel('New playlist name').fill('Hearthis imports');
  const trackRow = page.getByRole('listitem').filter({
    hasText: 'Deep Space Transmission',
  });
  await trackRow.getByRole('button', { name: 'Import' }).click();

  await expect(page.getByText(/Import completed/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open track' })).toBeVisible();
  await expect(
    trackRow.getByRole('button', { name: 'Imported' }),
  ).toBeDisabled();
  await expect(
    destination.getByRole('option', { name: 'Hearthis imports' }),
  ).toBeAttached();
});

test('board news supports optional images and links without empty thumbnails', async ({
  page,
}) => {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      return;
    }
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.isBoard = false;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.goto('/admin/news');
  await page.getByRole('button', { name: 'Write post' }).click();
  await page.getByLabel('Headline').fill('A linked announcement');
  await page.getByLabel('Short summary').fill('Read the complete update.');
  await page
    .getByLabel('Image URL')
    .fill('https://images.example.com/news.jpg');
  await page.getByLabel('Link URL').fill('https://tahti.live/about');
  await page.getByLabel('Link label').fill('Read more');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish' })
    .click();

  await page.goto('/whats-new');
  const linkedEntry = page
    .getByTestId('announcement-entry')
    .filter({ hasText: 'A linked announcement' });
  await expect(linkedEntry.getByRole('img')).toHaveAttribute(
    'src',
    'https://images.example.com/news.jpg',
  );
  await expect(
    linkedEntry.getByRole('link', { name: 'Read more' }),
  ).toHaveAttribute('href', 'https://tahti.live/about');

  const textOnlyEntry = page
    .getByTestId('announcement-entry')
    .filter({ hasText: 'Fair-rotation radio now covers 9 channels' });
  await expect(textOnlyEntry.getByRole('img')).toHaveCount(0);
});

test('artist stats combine audience metrics and listener maps in one place', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/stats');

  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
  await expect(page.getByText('Minutes listened')).toBeVisible();
  await expect(page.getByText('Minutes streamed')).toBeVisible();
  await expect(page.getByText('Followers')).toBeVisible();
  await expect(page.getByText('Smart-link clicks')).toBeVisible();
  await expect(page.getByLabel('Listener world map')).toBeVisible();
  await expect(page.getByText('Engagement units')).toBeVisible();

  await page
    .getByRole('link', { name: 'Insights for Northern Lights — Live Set' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Track insights' }),
  ).toBeVisible();
  await expect(page.getByLabel('Listener world map')).toBeVisible();
});

test('Tahti Selects recovers offline playback and shows the current stream', async ({
  page,
}) => {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      return;
    }
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.isBoard = false;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.goto('/admin/tahti-selects');

  await expect(page.getByText('Stream live')).toBeVisible();
  await expect(page.getByText('Aurora Drift').first()).toBeVisible();
  const playbackButton = page.getByRole('button', {
    name: 'Play Tahti Selects stream',
  });
  await playbackButton.click();
  await expect(
    page.getByRole('button', { name: 'Pause Tahti Selects stream' }),
  ).toBeVisible();
});

test('admin radio recognises rotation playback and uses the standard playlist editor', async ({
  page,
}) => {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      return;
    }
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.isBoard = false;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.goto('/admin/radio');

  await expect(page.getByText('Rotation on air')).toBeVisible();
  await expect(page.getByText('Aurora Drift').first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play Tahti Radio stream' }),
  ).toBeVisible();
  await expect(page.getByText('15:13 total')).toBeVisible();
  await expect(page.getByLabel('Tahti Radio rotation playlist')).toBeVisible();
  await expect(page.getByTestId('track-row')).toHaveCount(2);
});

test('branding workspace manages an avatar, public gallery, press kit, and slideshow', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/branding');

  await expect(
    page.getByRole('heading', { name: 'Artist branding' }),
  ).toBeVisible();
  await page.getByLabel('Profile picture').setInputFiles({
    name: 'portrait.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('portrait'),
  });
  await expect(
    page.getByRole('button', { name: 'View Demo Artist profile picture' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'View Demo Artist profile picture' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Demo Artist profile picture' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('tab', { name: 'Gallery' }).click();
  await page.getByRole('switch', { name: 'Public gallery' }).click();
  await page.getByLabel('Gallery images').setInputFiles(
    Array.from({ length: 11 }, (_, index) => ({
      name: `press-${index + 1}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.from(`press-${index + 1}`),
    })),
  );
  await expect(page.getByText(/11 images in gallery/)).toBeVisible();

  await page.getByRole('tab', { name: 'Press kit' }).click();
  await expect(page.getByText(/10 of 10 press kit images/)).toBeVisible();

  await page.goto('/u/demo');
  await page.getByRole('tab', { name: 'Gallery' }).click();
  await page.getByRole('button', { name: 'Start slideshow' }).click();
  await expect(page.getByText('1 / 11')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('2 / 11')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('admin user profile includes identity details and an expandable avatar', async ({
  page,
}) => {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      return;
    }
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.isBoard = false;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.goto('/admin/users');

  const roleFilter = page.getByLabel('Filter by role');
  await expect(
    roleFilter.getByRole('option', { name: 'Board' }),
  ).toBeAttached();
  await expect(
    roleFilter.getByRole('option', { name: 'Artist' }),
  ).toBeAttached();
  await expect(
    roleFilter.getByRole('option', { name: 'Listener' }),
  ).toBeAttached();
  await page.getByLabel('Account role').selectOption('BOARD');
  await page.getByRole('button', { name: 'Save account' }).click();
  await expect(page.getByText('User details saved.')).toBeVisible();
  await expect(page.getByText('Board', { exact: true }).last()).toBeVisible();

  await expect(page.getByText('she/her')).toBeVisible();
  await expect(
    page.getByText(/Helsinki selector spinning warm, filtered house/),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'View DJ Moonlight profile picture' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'DJ Moonlight profile picture' }),
  ).toBeVisible();
});

test('listener can open a fan subscription offer', async ({ page }) => {
  await page.goto('/subscribe/northern-lights');
  await expect(
    page.getByRole('heading', { name: /Subscribe to/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Subscribe' }).first(),
  ).toBeVisible();
});

test('DSP landing page leads with artwork and essential release metadata', async ({
  page,
}) => {
  await page.goto('/r/northern-lights-release-1');

  const artwork = page.getByRole('img', { name: 'First Light EP cover' });
  const heading = page.getByRole('heading', { name: 'First Light EP' });
  await expect(artwork).toBeVisible();
  await expect(heading).toBeVisible();
  const artworkBox = await artwork.boundingBox();
  const headingBox = await heading.boundingBox();
  expect(artworkBox!.y).toBeLessThan(headingBox!.y);
  await expect(page.getByText('2026', { exact: false })).toBeVisible();
  await expect(page.getByText('ambient', { exact: false })).toBeVisible();
  await expect(page.getByText(/CC BY|ALL RIGHTS RESERVED/)).toHaveCount(0);
});

test('keyboard navigation and review map work in the beta profile', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Alt+Digit2');
  await expect(page).toHaveURL(/\/radio$/);

  await page.goto('/more');
  await expect(page.getByRole('heading', { name: 'Tahti map' })).toBeVisible();
  await expect(
    page.getByText('You can:', { exact: false }).first(),
  ).toBeVisible();
});
