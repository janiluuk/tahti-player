import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 20_000 });
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

// Verifies the four plugins ported to src/plugins/ this session actually
// work end to end through the real UI, not just their unit tests. See
// PLUGIN-STORE-PLAN.md for what each extraction covers.

test('Studio Pro Editor plugin chain: add, configure, and remove a plugin', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/archive/arch-mock-1/editor');

  // Mastering (which hosts the plugin chain) is collapsed by default.
  await page.getByRole('button', { name: 'Expand mastering' }).click();

  await page.getByRole('button', { name: 'Add audio add-on' }).click();
  const picker = page.getByRole('dialog', { name: 'Add an audio add-on' });
  for (const name of ['Compressor', 'Limiter', 'Filter']) {
    await expect(
      picker.getByRole('button', { name: new RegExp(`^${name}`) }),
    ).toBeVisible();
  }
  await picker
    .getByRole('button', { name: 'EQ 3-band parametric equalizer' })
    .click();
  await expect(picker).toBeHidden();

  for (const band of [1, 2, 3]) {
    await expect(
      page.getByRole('slider', { name: `Band ${band} gain` }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Remove EQ' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'No audio add-ons in the chain yet.' }),
  ).toBeVisible();
});

test('Studio Go Live multistream: every API-supported provider is selectable, and an unlabeled destination falls back to the provider display name', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/go-live?step=destinations');

  await expect(page.getByText('YouTube')).toBeVisible();

  await page.getByRole('button', { name: 'Add destination' }).click();
  const dialog = page.getByRole('dialog');
  for (const provider of [
    'Twitch',
    'Facebook',
    'Kick',
    'TikTok',
    'Mixcloud Live',
    'Instagram',
    'Custom RTMP',
  ]) {
    await expect(dialog.getByRole('button', { name: provider })).toBeVisible();
  }

  await dialog.getByRole('button', { name: 'TikTok' }).click();
  await page.getByLabel(/Stream key/).fill('tiktok-stream-key-1234');
  await page.getByRole('button', { name: 'Save destination' }).click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'TikTok' }),
  ).toBeVisible();
});

test('Settings > Broadcast > Multistream: provider picker and existing-target labels use the registry too', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/settings/broadcast');
  await page.getByRole('tab', { name: /Multistream/ }).click();

  // The seeded YouTube target's label/author must resolve through the
  // registry, not display the raw wire id -- this panel had its own copy
  // of the same "raw provider" bug StudioGoLiveView/StreamManagerPanel
  // already had fixed.
  await expect(
    page.getByText('YouTube', { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: 'TikTok', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add TikTok' });
  await dialog.getByLabel('Stream key').fill('tiktok-settings-key-1234');
  await dialog.getByRole('button', { name: 'Add destination' }).click();
  const saved = page.getByRole('dialog', { name: 'Configure TikTok' });
  await expect(
    saved.getByRole('button', { name: 'Test connection' }),
  ).toBeVisible();
  await expect(saved.getByLabel('New stream key')).toHaveAttribute(
    'placeholder',
    /1234/,
  );
});

test('Settings artist connections: profile link fields render for export destinations', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/settings/artist?tab=connections');

  await expect(page.getByLabel('Spotify')).toBeVisible();
  await expect(page.getByLabel('Bandcamp')).toBeVisible();
  await expect(page.getByLabel('hearthis.at')).toBeVisible();
});

test('the Radio page and its visualizer log no console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/radio');
  await expect(
    page.getByRole('heading', { name: 'Radio', level: 1 }),
  ).toBeVisible();
  await page.waitForTimeout(1500);
  expect(
    errors.filter(
      (text) =>
        !/blocked by CORS policy|Failed to load resource: net::ERR_FAILED/.test(
          text,
        ),
    ),
  ).toEqual([]);
});

test('Themes lists built-in palettes and a theme configures its audio-reactive background', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/settings/themes');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  for (const theme of ['Default', 'Aurora', 'Ember', 'Lagoon', 'Moss']) {
    await expect(
      settings.getByRole('heading', { name: theme, exact: true }),
    ).toBeVisible();
  }
  await settings.getByRole('button', { name: 'Configure Default' }).click();
  const dialog = page.getByRole('dialog', { name: 'Configure theme' });
  await expect(
    dialog.getByRole('switch', { name: 'Audio reactivity' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();
});

const LISTEN_EMBED_ADDONS = [
  {
    name: 'SoundCloud',
    url: 'https://soundcloud.com/artist/track',
    type: 'soundcloud',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
    type: 'spotify',
  },
  {
    name: 'hearthis.at',
    url: '12345',
    type: 'hearthis',
  },
  {
    name: 'Bandcamp',
    url: 'https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/tracklist=false/',
    type: 'bandcamp',
  },
] as const;

async function clearListenAddons(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('tahti-web-listener-widgets');
  });
}

/** The add-on store now opens from the Listen "Add new listen widget"
 * dialog's "Browse all add-ons" link. */
async function openListenAddonStore(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.getByRole('button', { name: 'Add new listen widget' }).click();
  await page.getByRole('button', { name: /Browse all add-ons/ }).click();
}

test('Add new listen widget adds a playlist row from a pasted link', async ({
  page,
}) => {
  await page.goto('/');
  await clearListenAddons(page);
  await page.reload();
  await page.getByRole('button', { name: 'Add new listen widget' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('add-listen-widget-service-youtube').click();
  await expect(
    dialog.getByText(/^Example: https:\/\/www\.youtube\.com/),
  ).toBeVisible();
  await dialog
    .getByLabel('Playlist link')
    .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await dialog.getByLabel('Row name').fill('Late night picks');
  await dialog.getByTestId('add-listen-widget-submit').click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('main').locator('[data-widget-type="youtube"]'),
  ).toBeVisible();
});

test('Listen add-widget dialog lists every Listen store add-on', async ({
  page,
}) => {
  await signIn(page);
  await clearListenAddons(page);
  await page.goto('/');
  await openListenAddonStore(page);
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'All Listen add-ons' }),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('Favorites'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('SoundCloud'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('YouTube'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('Spotify'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('hearthis.at'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('Bandcamp'),
  ).toBeVisible();
  await expect(
    dialog.getByTestId('plugin-store-item-name').getByText('News'),
  ).toBeVisible();
});

test('Listen add-widget picker installs, configures, and uninstalls every Listen add-on without closing', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signIn(page);
  await clearListenAddons(page);
  await page.goto('/');
  await openListenAddonStore(page);
  const dialog = page.getByRole('dialog');

  for (const addon of LISTEN_EMBED_ADDONS) {
    await dialog.getByRole('tab', { name: /Available/ }).click();
    const card = dialog
      .getByTestId('plugin-store-item')
      .filter({ hasText: addon.name });
    await card.getByRole('button', { name: 'Install' }).click();
    await expect(
      dialog.getByRole('heading', { name: 'All Listen add-ons' }),
    ).toBeVisible();
    await dialog.getByLabel(`Add a ${addon.name} link`).fill(addon.url);
    await dialog
      .getByTestId(`listen-addon-config-${addon.name}`)
      .getByRole('button', { name: 'Add', exact: true })
      .click();
    await expect(
      dialog.locator(
        `[data-testid="listener-widget-embed"][data-widget-type="${addon.type}"]`,
      ),
    ).toBeVisible();
  }

  await dialog.getByRole('tab', { name: /Available/ }).click();
  await dialog
    .getByTestId('plugin-store-item')
    .filter({ hasText: 'Favorites' })
    .getByRole('button', { name: 'Install' })
    .click();
  await expect(
    dialog.getByText('Enabled favorites appear on the Listen page.'),
  ).toBeVisible();

  await dialog.getByTestId('dialog-x-close').click();
  await expect(dialog).toBeHidden();

  const section = page.getByRole('main');
  for (const addon of LISTEN_EMBED_ADDONS) {
    await expect(
      section.locator(`[data-widget-type="${addon.type}"]`),
    ).toBeVisible();
  }
  await expect(
    section.getByRole('heading', { name: 'Channels' }),
  ).toBeVisible();

  await openListenAddonStore(page);
  const again = page.getByRole('dialog');
  await again.getByRole('tab', { name: /Installed/ }).click();
  for (const addon of [...LISTEN_EMBED_ADDONS].reverse()) {
    await again
      .getByRole('button', { name: `Uninstall ${addon.name}` })
      .click();
  }
  await again.getByRole('button', { name: 'Uninstall Favorites' }).click();
  await again.getByTestId('dialog-x-close').click();

  await expect(
    page.getByRole('main').locator('[data-widget-type]'),
  ).toHaveCount(0);
});

test('Settings Add-ons Listen tab can add and remove a widget on Listen', async ({
  page,
}) => {
  await signIn(page);
  await clearListenAddons(page);
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Add new listen widget' }),
  ).toBeVisible();
  await page.goto('/settings/plugin-store?category=listen');

  const settings = page.getByRole('dialog');
  await expect(
    settings.getByRole('button', { name: /^Listen widgets/ }),
  ).toHaveAttribute('aria-expanded', 'true');
  await settings.getByRole('tab', { name: /Available/ }).click();
  await settings
    .getByTestId('plugin-store-item')
    .filter({ hasText: 'YouTube' })
    .getByRole('button', { name: 'Install' })
    .click();
  await settings
    .getByLabel('Add a YouTube link')
    .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await settings
    .getByTestId('listen-addon-config-YouTube')
    .getByRole('button', { name: 'Add', exact: true })
    .click();
  await expect(settings.locator('[data-widget-type="youtube"]')).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => localStorage.getItem('tahti-web-listener-widgets')),
    )
    .toContain('youtube');
  await settings.getByTestId('dialog-x-close').click();

  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Add new listen widget' }),
  ).toBeVisible();
  await expect(
    page.getByRole('main').locator('[data-widget-type="youtube"]'),
  ).toBeVisible();

  await page.goto('/settings/plugin-store?category=listen');
  const again = page.getByRole('dialog');
  await again.getByRole('tab', { name: /Installed/ }).click();
  await again.getByRole('button', { name: 'Uninstall YouTube' }).click();
  await again.getByTestId('dialog-x-close').click();

  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Add new listen widget' }),
  ).toBeVisible();
  await expect(
    page.getByRole('main').locator('[data-widget-type]'),
  ).toHaveCount(0);
});

test('Studio release fingerprinting: check and re-fingerprint a track through the AcoustID plugin', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/releases/rel-mock-1');
  await page.getByRole('tab', { name: 'Advanced' }).click();

  const blueHourPanel = page.getByRole('group', {
    name: 'Fingerprinting Blue Hour',
  });
  await expect(blueHourPanel).toBeVisible();

  await blueHourPanel
    .getByRole('button', { name: 'Check for a match' })
    .click();
  await expect(
    blueHourPanel.getByText('No match found. Nothing was changed.'),
  ).toBeVisible();

  await blueHourPanel.getByRole('button', { name: 'Re-fingerprint' }).click();
  await expect(
    blueHourPanel.getByText(/Matches .Similar Sounding Track./),
  ).toBeVisible();
});

async function mockRadioBrowserApi(
  page: import('@playwright/test').Page,
): Promise<void> {
  const station = {
    stationuuid: 'e2e-test-station',
    name: 'E2E Test Radio',
    url_resolved: 'https://example.test/stream.mp3',
    homepage: '',
    favicon: '',
    tags: 'test',
    country: 'Finland',
    countrycode: 'FI',
    codec: 'MP3',
    bitrate: 128,
  };
  await page.route('**/de1.api.radio-browser.info/json/stats', (route) =>
    route.fulfill({ json: { stations: 50000 } }),
  );
  await page.route(
    '**/de1.api.radio-browser.info/json/stations/search**',
    (route) => route.fulfill({ json: [station] }),
  );
  await page.route('**/de1.api.radio-browser.info/json/countries', (route) =>
    route.fulfill({
      json: [{ name: 'Finland', iso_3166_1: 'FI', stationcount: 12 }],
    }),
  );
  await page.route('**/de1.api.radio-browser.info/json/tags**', (route) =>
    route.fulfill({ json: [{ name: 'test', stationcount: 1 }] }),
  );
}

test('Radio Browser directory: save a station from Browser and it shows on Listen', async ({
  page,
}) => {
  await signIn(page);
  await clearListenAddons(page);
  await mockRadioBrowserApi(page);

  await page.goto('/settings/plugin-store?category=radio');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Activate', exact: true }).click();
  await settings
    .getByRole('button', { name: 'Configure', exact: true })
    .click();

  const configure = page.getByRole('dialog', {
    name: 'Configure Radio Browser directory',
  });
  await configure.getByRole('tab', { name: 'Browser' }).click();
  const row = configure
    .getByRole('listitem')
    .filter({ hasText: 'E2E Test Radio' });
  await expect(row).toBeVisible();
  await row
    .getByRole('button', { name: /Save E2E Test Radio to Listen/ })
    .click();
  await expect(
    row.getByRole('button', { name: /Remove E2E Test Radio from Listen/ }),
  ).toBeVisible();

  await configure.getByRole('button', { name: 'Done' }).click();
  await settings.getByTestId('dialog-x-close').click();

  await page.goto('/');
  await expect(
    page.getByRole('main').getByText('E2E Test Radio').first(),
  ).toBeVisible();
});
