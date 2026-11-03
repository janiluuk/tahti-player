import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

const PRESS_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test('legacy callbacks land on the matching SPA surface', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard?membership=success');
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();

  await page.goto('/dashboard?fanConnect=return');
  await expect(page).toHaveURL(/\/studio\/stripe\?fanConnect=return$/);

  await page.goto('/dashboard/upload/import/soundcloud?sc=connected');
  await expect(page.getByText('SoundCloud connected.')).toBeVisible();
  await expect(page).toHaveURL(/\/settings\/plugin-store/);
});

test('registration asks for an artist name and matching passwords', async ({
  page,
}) => {
  await page.goto('/join');

  await expect(page.getByLabel('Artist name')).toBeVisible();
  await expect(
    page.getByRole('radiogroup', { name: 'Account type' }),
  ).toBeVisible();
  await expect(page.getByLabel('Verification token')).toHaveCount(0);
  await page.getByLabel('Email').fill('new-artist@tahti.live');
  await page.getByLabel('Artist name').fill('New Artist');
  await expect(page.getByTestId('username-hint')).toContainText('new-artist');
  await page.getByLabel('Password', { exact: true }).fill('Secure-Passw0rd');
  await page.getByLabel('Confirm password').fill('Different-Passw0rd');
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create account' }),
  ).toBeDisabled();

  await page.getByLabel('Confirm password').fill('Secure-Passw0rd');
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
  await expect(page.getByRole('heading', { name: 'Go live' })).toBeVisible();
  await page.getByRole('tab', { name: 'Recording' }).click();
  const recordingToggle = page.getByRole('switch', {
    name: 'Record broadcast',
  });
  await expect(recordingToggle).toHaveAttribute('aria-checked', 'true');
  await recordingToggle.click();
  await page.reload();
  await page.getByRole('tab', { name: 'Recording' }).click();
  await expect(recordingToggle).toHaveAttribute('aria-checked', 'false');
  await expect(
    page.getByRole('link', { name: 'Open recordings' }),
  ).toBeVisible();

  await page.goto('/studio/upload');
  await expect(page.getByRole('heading', { name: 'Upload' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Import sources' }),
  ).toBeVisible();
});

test('studio home groups its tools and the Stats card opens Stats', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio');

  await expect(page.getByRole('heading', { name: 'Studio' })).toBeVisible();
  const main = page.getByRole('main');
  for (const group of ['Broadcast', 'Music', 'Audience & channel']) {
    await expect(
      main.getByRole('heading', { name: group, level: 2, exact: true }),
    ).toBeVisible();
  }
  await expect(main.getByRole('link', { name: /^Go live/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /^Upload/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /^Releases/ })).toBeVisible();
  await main.getByRole('link', { name: /^Stats Plays/ }).click();
  await expect(page).toHaveURL(/\/studio\/stats$/);
});

test('fan subscriptions show subscriber, revenue, and payout statistics', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/audience');

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
  await page.goto('/library/sounds');

  await expect(page.getByRole('tab', { name: 'Sounds' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'Recordings' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Collections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sounds' })).toBeVisible();
  await expect(page.getByText('Northern Lights — Live Set')).toBeVisible();
  await expect(page.getByText('Studio sketch A')).toBeVisible();
  await expect(page.getByText(/Pinned \d+/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Messages' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Collections' }).click();
  await expect(page).toHaveURL(/\/library\/collections$/);
  await expect(
    page.getByRole('heading', { name: 'Collections' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Sounds' }).click();

  await page.getByLabel('Search sounds').fill('Studio sketch');
  await expect(page.getByText('Northern Lights — Live Set')).not.toBeVisible();
  const sketchLink = page.getByRole('link', {
    name: 'Studio sketch A',
    exact: true,
  });
  const trackHref = await sketchLink.getAttribute('href');
  expect(trackHref).toMatch(/^\/t\//);
  await page.goto(trackHref!.replace('/t/', '/studio/sounds/'));
  await expect(page.getByRole('tab', { name: 'Details' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit details' }).click();

  await expect(page.getByRole('button', { name: 'Play track' })).toBeVisible();
  await expect(
    page.getByRole('tablist', { name: 'Library sections' }),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to Music' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
  await expect(page.getByLabel('Release date')).toBeVisible();
  await expect(page.getByLabel('Audience')).toBeVisible();
  await expect(page.getByLabel('Allow downloads')).toBeVisible();
  await expect(page.getByLabel('Allow comments')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open audio editor' }),
  ).toBeVisible();
  await expect(
    page.getByRole('slider', { name: 'Waveform: Studio sketch A' }),
  ).toBeVisible();

  await page.getByRole('tab', { name: 'Playlists' }).click();
  await expect(
    page.getByRole('button', { name: /^(Add to|Remove from) rotation$/ }),
  ).toBeVisible();
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

  await expect(page.getByRole('tab', { name: /Albums/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /EPs/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /DJ sets/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Playlists/ })).toBeVisible();
  await page.getByRole('tab', { name: /Albums/ }).click();
  await expect(page.getByText('Midnight Archive')).toBeVisible();
  await page.getByRole('tab', { name: /EPs/ }).click();
  await expect(page.getByText('Short Signals')).toBeVisible();
  await page.getByRole('tab', { name: /DJ sets/ }).click();
  await expect(page.getByText('Northern Lights DJ set')).toBeVisible();
  await page.getByRole('tab', { name: /Playlists/ }).click();
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

  await page.goto('/library/embeds');
  await expect(
    page.getByRole('tab', { name: 'Embeds', selected: true }),
  ).toBeVisible();

  await page.goto('/messages');
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
});

test('artist track titles open details while row controls handle playback and queueing', async ({
  page,
}) => {
  await page.goto('/u/northern-lights');

  const row = () =>
    page
      .getByRole('listitem')
      .filter({
        has: page.getByRole('heading', { name: 'Midnight Broadcast' }),
      })
      .first();
  await row().getByRole('link', { name: 'Midnight Broadcast' }).click();
  await expect(page).toHaveURL(/\/t\//);
  await expect(
    page.getByRole('heading', { name: 'Midnight Broadcast', level: 1 }),
  ).toBeVisible();

  await page.goto('/u/northern-lights');
  await row().getByRole('button', { name: 'Play Midnight Broadcast' }).click();
  await expect(
    row().getByRole('button', { name: 'Pause Midnight Broadcast' }),
  ).toBeVisible();
  await expect(row().getByRole('button', { name: /^In queue/ })).toBeDisabled();
});

test('a visitor subscribes to an artist by email', async ({ page }) => {
  await page.goto('/u/northern-lights');
  await page
    .getByRole('button', { name: 'Email updates from Northern Lights' })
    .click();
  await page.getByLabel('Email address').fill('listener@example.com');
  await page
    .getByTestId('artist-social-header')
    .getByRole('button', { name: 'Subscribe', exact: true })
    .click();
  await expect(page.getByText(/Check your email to confirm/)).toBeVisible();
});

test('queue actions show queued state and the queue panel can be cleared', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/u/northern-lights');

  const row = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Aurora Drift' }) })
    .first();
  await row.getByRole('button', { name: /^Queue / }).click();
  await expect(row.getByRole('button', { name: /^In queue/ })).toBeDisabled();

  await page.getByRole('button', { name: 'Expand right panel' }).click();
  const queue = page.getByRole('complementary', { name: 'Queue' });
  await expect(queue.getByText('Aurora Drift').first()).toBeVisible();
  await page.getByRole('button', { name: 'Clear queue' }).click();
  await expect(queue.getByText('Aurora Drift')).toHaveCount(0);
});

test('Sources leaves broadcast captures to the recordings flow', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/sources');
  await expect(page.getByText('From broadcast')).toHaveCount(0);
});

test('hearthis imports report completion and prevent duplicates', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/upload');
  await page.getByRole('button', { name: /^hearthis\.at/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Configure hearthis.at' });
  await dialog.getByLabel('hearthis.at username').fill('northernlights');
  await dialog.getByRole('button', { name: 'Connect' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Destination playlist' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Import completed');
  await expect(dialog.getByRole('button', { name: 'Imported' })).toBeDisabled();
  await expect(
    dialog.getByRole('switch', { name: 'Select Deep Space Transmission' }),
  ).toBeDisabled();
});

test("board news with an image and a link shows the link on What's new", async ({
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
    .getByRole('dialog')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'news.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
  await page.getByLabel('Link URL').fill('https://tahti.live/about');
  await page.getByLabel('Link label').fill('Read more');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish' })
    .click();

  await page.goto('/news');
  const linkedEntry = page
    .getByTestId('announcement-entry')
    .filter({ hasText: 'A linked announcement' });
  await expect(
    linkedEntry.getByRole('link', { name: 'Read more' }),
  ).toHaveAttribute('href', 'https://tahti.live/about');
});

test('artist stats combine audience metrics and listener maps in one place', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/stats');

  await expect(
    page.getByRole('heading', { name: 'Stats', level: 1 }),
  ).toBeVisible();
  const metrics = page.getByRole('region', { name: 'Key metrics' });
  for (const label of [
    'Minutes listened',
    'Minutes streamed',
    'Followers',
    'Smart-link clicks',
  ]) {
    await expect(metrics.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByRole('heading', { name: 'Engagement units' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Plays & listeners' }).click();
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
  await expect(page.getByText('10:34 total')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Current rotation (2)' }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ has: page.getByRole('cell') }),
  ).toHaveCount(2);
});

test('artist branding keeps the picture, gallery and press kit in Settings → Artist', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/branding');
  await expect(page).toHaveURL(/\/settings\/artist\?tab=branding/);
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    settings.getByRole('heading', { name: 'Profile picture' }),
  ).toBeVisible();
  await expect(
    settings.getByRole('button', { name: 'Change profile picture' }),
  ).toBeVisible();

  await settings.getByRole('tab', { name: 'Gallery' }).click();
  const publicGallery = settings.getByRole('switch', {
    name: 'Public gallery',
  });
  const wasPublic = await publicGallery.isChecked();
  await publicGallery.click();
  await expect(publicGallery).toBeChecked({ checked: !wasPublic });

  await settings.getByRole('tab', { name: 'Links & press' }).click();
  await settings.getByRole('tab', { name: 'Press kit' }).click();
  await settings.getByRole('button', { name: 'Save bio' }).click();
  await expect(page.getByText('Press kit bio saved.')).toBeVisible();
  await settings.getByLabel('Drop press-kit photos here').setInputFiles(
    ['one', 'two'].map((name) => ({
      name: `promo-${name}.png`,
      mimeType: 'image/png',
      buffer: PRESS_PNG,
    })),
  );
  await expect(settings.getByText(/2 of 10 press kit images/)).toBeVisible();
  await expect(
    settings.getByRole('button', { name: 'Download ZIP' }),
  ).toBeVisible();
});

test('help center documents artist gallery upload and reorder', async ({
  page,
}) => {
  await page.goto('/help/for-artists');
  await expect(page.getByTestId('page-title')).toHaveText('Artist guide');
  await expect(
    page.getByRole('heading', { name: 'Artist gallery' }),
  ).toBeVisible();
  await expect(page.getByText(/Drag a photo to reorder/)).toBeVisible();
  await expect(page.getByText(/no separate Add images button/)).toBeVisible();
});

test('the Radio page keeps Stream, 24/7, Tahti Radio and Multicast as tabs', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/channel?tab=radio');
  await expect(
    page.getByRole('heading', { name: 'Radio', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to Broadcast' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Multicast' }).click();
  await expect(page).toHaveURL(/\/studio\/channel\?tab=multicast/);
  await expect(page.getByRole('tab', { name: 'Multicast' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('listen chrome lights Listen on child tabs and Library on favorites', async ({
  page,
}) => {
  await page.goto('/');
  const sidebar = page.getByTestId('sidebar-navigation');
  await expect(sidebar.getByRole('link', { name: 'Listen' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('tab', { name: 'Listen' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto('/listen/feed');
  await expect(sidebar.getByRole('link', { name: 'Listen' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(sidebar.getByRole('link', { name: 'Favorites' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Feed' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto('/favorites');
  await expect(page).toHaveURL(/\/library\/favorites$/);
  await expect(sidebar.getByRole('link', { name: 'Library' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    sidebar.getByRole('link', { name: 'Listen' }),
  ).not.toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('heading', { name: 'Favorites', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Favorites' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
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

  await page.getByLabel('Filter by role').click();
  await expect(page.getByRole('option', { name: 'Board' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Artist' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Listener' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Role', exact: true }).click();
  await page.getByRole('option', { name: 'Board' }).click();
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
    page
      .getByRole('dialog', { name: 'DJ Moonlight profile picture' })
      .getByRole('button', { name: 'Close image viewer' }),
  ).toBeVisible();
});

test('listener can open a fan subscription offer', async ({ page }) => {
  await page.goto('/subscribe/northern-lights');
  await expect(
    page.getByRole('heading', { name: /Subscribe to/, level: 1 }),
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
  const artworkLeads =
    artworkBox!.y + artworkBox!.height <= headingBox!.y ||
    artworkBox!.x + artworkBox!.width <= headingBox!.x;
  expect(artworkLeads).toBe(true);
  await expect(page.getByText('2026', { exact: false }).first()).toBeVisible();
  await expect(
    page.getByText('ambient', { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByText(/CC BY|ALL RIGHTS RESERVED/)).toHaveCount(0);
});

test('keyboard navigation and review map work in the beta profile', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 400 } });
  await page.keyboard.press('Alt+Digit2');
  await expect(page).toHaveURL(/\/radio$/);
  await page.keyboard.press('Alt+Digit3');
  await expect(page).toHaveURL(/\/discover/);

  await page.goto('/more');
  await expect(page.getByRole('heading', { name: 'Tahti map' })).toBeVisible();
  await expect(
    page.getByText('You can:', { exact: false }).first(),
  ).toBeVisible();
});
