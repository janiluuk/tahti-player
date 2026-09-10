import { expect, test } from '@playwright/test';

// Covers the real, UI-complete journeys behind the "signup + governance
// voting + stats" request: full registration -> login, governance voting
// mechanics (including the closed-motion history/decision log, which is
// this app's real equivalent of a "voting history" page), and the studio
// stats/listener-map page. Two things from the original ask have NO UI in
// this codebase today and are deliberately not tested here: liking a track
// (toggleFavoriteTrack is 100% localStorage, never reaches the server, so
// there is nothing for an artist to be notified about) and following an
// artist (followArtist/unfollowArtist/fetchFollowing exist in api/client.ts
// but are not called from any view -- no Follow button exists anywhere).

async function signIn(
  page: import('@playwright/test').Page,
  email = 'artist@tahti.live',
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('demo-password');
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

test('login form submits on pressing Enter, not just clicking Sign in', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('artist@tahti.live');
  await page.getByLabel('Password').fill('demo-password');
  await page.getByLabel('Password').press('Enter');

  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
});

test('a new account can complete registration and immediately log in with it', async ({
  page,
}) => {
  const email = `new-artist-${Date.now()}@example.com`;

  await page.goto('/join');
  await expect(page.getByLabel('Artist name')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Username').fill(`newartist${Date.now()}`);
  await page.getByLabel('Artist name').fill('New Test Artist');
  await page.getByLabel('Password', { exact: true }).fill('secure-password');
  await page.getByLabel('Confirm password').fill('secure-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  // Mock registration always succeeds and switches the dialog to login
  // mode -- there's no email-verification step to wait through offline.
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('secure-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
});

test('registration edge case: an empty artist name keeps the submit button disabled', async ({
  page,
}) => {
  await page.goto('/join');
  await page.getByLabel('Email').fill('edge-case@example.com');
  await page.getByLabel('Username').fill('edgecase');
  await page.getByLabel('Password', { exact: true }).fill('secure-password');
  await page.getByLabel('Confirm password').fill('secure-password');

  await expect(page.getByLabel('Artist name')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Create account' }),
  ).toBeDisabled();
});

test('governance: a signed-out visitor is prompted to log in, not shown motions', async ({
  page,
}) => {
  await page.goto('/governance');

  await expect(
    page
      .getByText('Sign in with a cooperative membership account to vote.')
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Approve 2026 grant formula' }),
  ).toHaveCount(0);
});

test('governance navigation keeps member, artist, and board entries reachable and highlighted', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/settings/account');
  await page.getByRole('tab', { name: 'Governance' }).click();
  await expect(page.getByRole('heading', { name: 'Governance' })).toBeVisible();

  await page.goto('/studio/governance');
  await expect(
    page
      .getByRole('navigation', { name: 'Studio pages' })
      .getByRole('link', { name: 'Governance' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('tab', { name: 'Motions' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Topics' }).click();
  await expect(page).toHaveURL(/\/studio\/governance\?tab=topics$/);
  await expect(page.getByRole('tab', { name: 'Topics' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Studio pages' })
      .getByRole('link', { name: 'Governance' }),
  ).toHaveAttribute('aria-current', 'page');

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
  await page.reload();
  await page.goto('/admin/governance');
  await expect(page.getByRole('tab', { name: 'Community' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .getByRole('tablist', { name: 'Admin Community' })
      .getByRole('tab', { name: 'Governance' }),
  ).toHaveAttribute('aria-selected', 'true');

  // AGM (and Annual reports / Grants) are now tabs inside the single
  // consolidated /admin/governance page, not their own Admin Community
  // entries — /admin/agm redirects to /admin/governance/agm.
  await page.goto('/admin/agm');
  await expect(page).toHaveURL(/\/admin\/governance\/agm$/);
  await expect(page.getByRole('tab', { name: 'Community' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .getByRole('tablist', { name: 'Admin Community' })
      .getByRole('tab', { name: 'Governance' }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page
      .getByRole('tablist', { name: 'Governance sections' })
      .getByRole('tab', { name: 'AGM' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('library is a Studio tab and keeps /library routes selected on Studio', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/library');
  const studioPages = page.getByRole('navigation', { name: 'Studio pages' });
  await expect(studioPages).toBeVisible();
  await expect(
    studioPages.getByRole('link', { name: 'Library' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(studioPages.getByRole('link', { name: 'Sounds' })).toBeVisible();
  await expect(
    studioPages.getByRole('link', { name: 'Collections' }),
  ).toBeVisible();
  await expect(
    page.getByTestId('sidebar-navigation-item').filter({ hasText: 'Studio' }),
  ).toHaveClass(/bg-primary/);
  await expect(
    page
      .getByTestId('sidebar-navigation-item')
      .filter({ hasText: /^Library$/ }),
  ).toHaveCount(0);

  await studioPages.getByRole('link', { name: 'Sounds' }).click();
  await expect(page).toHaveURL(/\/library\/sounds$/);
  await expect(
    studioPages.getByRole('link', { name: 'Sounds' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    studioPages.getByRole('link', { name: 'Library' }),
  ).not.toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByTestId('sidebar-navigation-item').filter({ hasText: 'Studio' }),
  ).toHaveClass(/bg-primary/);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePrimary = page.getByRole('navigation', { name: 'Primary' });
  await expect(mobilePrimary).toBeVisible();
  await expect(
    mobilePrimary.getByRole('link', { name: 'Listen' }),
  ).toBeVisible();
  await mobilePrimary.getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Library' }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(
    page.getByRole('navigation', { name: 'Studio pages' }),
  ).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/library/favorites');
  await expect(page).toHaveURL(/\/favorites$/);
});

test('governance: closed motions show their final decision as a permanent history/decision log', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/governance');

  const closedMotion = page
    .getByRole('listitem')
    .filter({ hasText: 'Confirm annual report' });
  await expect(closedMotion.getByText('Closed')).toBeVisible();
  await expect(closedMotion.getByText('Your vote:')).toBeVisible();
  await expect(closedMotion.getByText('YES', { exact: true })).toBeVisible();
  await expect(closedMotion.getByText('YES 10')).toBeVisible();
  await expect(closedMotion.getByText('NO 1')).toBeVisible();
  await expect(closedMotion.getByText('ABSTAIN 1')).toBeVisible();
  // A decided motion never shows voting controls again.
  await expect(
    closedMotion.getByRole('button', { name: 'YES', exact: true }),
  ).toHaveCount(0);
});

test('governance: voting on an open motion records the choice and updates the tally live', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/governance');

  const openMotion = page
    .getByRole('listitem')
    .filter({ hasText: 'Approve 2026 grant formula' });
  await expect(openMotion.getByText('Open')).toBeVisible();
  await expect(openMotion.getByText('YES 1')).toBeVisible();
  await expect(openMotion.getByText('Your vote:')).toHaveCount(0);

  await openMotion.getByRole('button', { name: 'YES', exact: true }).click();

  await expect(openMotion.getByText('Your vote:')).toBeVisible();
  await expect(openMotion.getByText('YES 2')).toBeVisible();
  // Edge case: once voted, the motion can't be voted on again -- the
  // choice buttons are gone entirely, not just disabled.
  await expect(
    openMotion.getByRole('button', { name: 'YES', exact: true }),
  ).toHaveCount(0);
  await expect(
    openMotion.getByRole('button', { name: 'NO', exact: true }),
  ).toHaveCount(0);
});

test('governance: motion discussion supports reading existing comments and posting a new one', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/governance');

  const openMotion = page
    .getByRole('listitem')
    .filter({ hasText: 'Approve 2026 grant formula' });
  await openMotion.getByRole('button', { name: 'Discussion' }).click();

  await expect(
    openMotion.getByText('Mock comment — looks good.'),
  ).toBeVisible();

  await openMotion.getByPlaceholder('Add a comment…').fill('Sounds good.');
  await openMotion.getByRole('button', { name: 'Post' }).click();

  await expect(openMotion.getByText('Sounds good.')).toBeVisible();
  await expect(page.getByText('Comment posted.')).toBeVisible();

  // Edge case: a closed motion's discussion is read-only -- no comment box.
  await openMotion.getByRole('button', { name: 'Hide discussion' }).click();
  const closedMotion = page
    .getByRole('listitem')
    .filter({ hasText: 'Confirm annual report' });
  await closedMotion.getByRole('button', { name: 'Discussion' }).click();
  await expect(closedMotion.getByPlaceholder('Add a comment…')).toHaveCount(0);
});

test('governance: a member can submit an advisory motion draft', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/governance');

  await page.getByPlaceholder('Motion title').fill('Improve member notices');
  await page
    .getByPlaceholder('Explain the proposal')
    .fill('Send meeting notices in the member dashboard.');
  await page.getByRole('button', { name: 'Submit draft' }).click();

  await expect(
    page.getByText('Motion draft submitted for board review.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Improve member notices' }),
  ).toBeVisible();
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
});

test('governance: public history and historical grant reports are reachable', async ({
  page,
}) => {
  await page.goto('/governance/history');
  await expect(
    page.getByRole('heading', { name: 'Governance history' }),
  ).toBeVisible();
  await expect(page.getByText('Confirm annual report')).toBeVisible();

  await page.goto('/transparency');
  await expect(page.getByRole('link', { name: /Grants 2025/ })).toBeVisible();
  await page.getByRole('link', { name: /Grants 2025/ }).click();
  await expect(page).toHaveURL(/\/transparency\/grants\/2025$/);
  await expect(
    page.getByRole('heading', { name: 'Grant report 2025' }),
  ).toBeVisible();
});

test('artist stats show real listen minutes and the listener geography map', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/stats');

  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();
  await expect(page.getByText('Minutes listened')).toBeVisible();
  await expect(page.getByLabel('Listener world map')).toBeVisible();
  // Edge case worth documenting in the test itself: there is no "likes"
  // metric anywhere on this page -- favoriting a track never leaves the
  // browser (see the file-level comment), so an artist has no way to see
  // like counts here or anywhere else in the product today.
  await expect(page.getByText(/^Likes$/)).toHaveCount(0);
});

test('stream manager: stopping a live broadcast requires confirmation, and the rotation controls (irrelevant while live) are replaced by it', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/go-live');

  // Before any signal: the fallback-rotation transport controls are the
  // relevant thing to show (a live broadcast always takes priority over
  // them anyway, so they'd previously still render, pointlessly, once live).
  await expect(
    page.getByRole('button', { name: 'Start rotation' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop stream' })).toHaveCount(
    0,
  );

  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText('Connected')).toBeVisible({ timeout: 10_000 });

  // Once live, "Start rotation" (which only ever controlled the rotation, not the
  // broadcast) is gone, replaced by a real "Stop stream" action.
  await expect(
    page.getByRole('button', { name: 'Start rotation' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Stop stream' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Stop your live stream?');
  // Edge case: cancelling the confirm dialog doesn't end the broadcast.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Connected')).toBeVisible();
});
