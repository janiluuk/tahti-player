import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

import {
  CAPTURE_THEME_MODE,
  CAPTURE_THEME_STATE,
  prepareCapturePage,
  withThemeSuffix,
} from './lib/captureSetup.mjs';

const BASE = process.env.README_GUIDE_BASE_URL || 'http://127.0.0.1:5180';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(scriptDirectory, '..');
const outputDirectory = join(packageRoot, 'docs/readme-shots');
const readmePath = join(packageRoot, 'README.md');
const viewGuidePath = join(packageRoot, 'docs/VIEW-GUIDE.md');
mkdirSync(outputDirectory, { recursive: true });

/** Main-feature highlights shown in README.md (full index lives in VIEW-GUIDE.md). */
const HIGHLIGHTS = [
  {
    section: 'Listen',
    blurb:
      'Discover stations and catalogue, then keep listening from the persistent player.',
    files: [
      'listen-home',
      'listen-radio',
      'listen-discover',
      'public-channel-aurora',
    ],
  },
  {
    section: 'Publish',
    blurb:
      'Upload, organise sounds and releases, and prepare catalogue for the public channel.',
    files: [
      'studio-sounds',
      'studio-releases',
      'studio-upload',
      'studio-collections',
    ],
  },
  {
    section: 'Broadcast',
    blurb: 'Go live, programme the schedule, and run channel / radio controls.',
    files: [
      'studio-go-live',
      'studio-schedule',
      'studio-radio',
      'studio-branding',
    ],
  },
  {
    section: 'Connect',
    blurb: 'Artist identity, audience, messages and community governance.',
    files: [
      'public-artist',
      'studio-audience',
      'listener-messages',
      'governance',
    ],
  },
  {
    section: 'Operate',
    blurb:
      'Board tools for health, moderation queues and live stream oversight.',
    files: [
      'admin-overview',
      'admin-moderation',
      'admin-streams',
      'admin-status',
    ],
  },
];

const auth = {
  state: {
    user: {
      id: 'mock-board-1',
      email: 'board@tahti.live',
      username: 'board',
      displayName: 'Board Member',
      role: 'BOARD',
      isBoard: true,
      membershipStatus: 'ACTIVE',
      channel: { slug: 'demo', state: 'OFFLINE' },
    },
  },
  version: 0,
};

const layout = {
  state: {
    leftCollapsed: false,
    rightCollapsed: true,
    bottomQueueOpen: false,
    leftWidth: 220,
    rightWidth: 340,
    chatSlug: null,
    chatEnabled: false,
    chatDisabledReason: null,
    chatAutoOpenedFor: null,
  },
  version: 3,
};

const routes = [
  [
    '/',
    'listen-home',
    'Listener home',
    'Browse stations, releases and the active player.',
  ],
  [
    '/radio',
    'listen-radio',
    'Radio directory',
    'Find live channels and open a station.',
  ],
  [
    '/discover',
    'listen-discover',
    'Discover',
    'Explore tracks, artists and collections.',
  ],
  [
    '/feed',
    'listen-feed',
    'Your feed',
    'Follow updates and play shared tracks.',
  ],
  [
    '/library',
    'library-all-sounds',
    'Library / All sounds',
    'Manage uploaded audio with search, filters and playback.',
  ],
  [
    '/library/collections',
    'library-collections',
    'Library / Collections',
    'Organize albums, EPs, playlists and podcasts.',
  ],
  [
    '/library/recordings',
    'library-recordings',
    'Library / Recordings',
    'Review recordings from broadcasts and shows.',
  ],
  [
    '/library/history',
    'library-history',
    'Library / History',
    'Return to recently played items and listening history.',
  ],
  [
    '/library/favorites',
    'library-favorites',
    'Library / Favourites',
    'Keep loved tracks available from the main library.',
  ],
  [
    '/library/smartlinks',
    'library-smartlinks',
    'Library / Smartlinks',
    'Create and monitor shareable release links.',
  ],
  [
    '/messages',
    'listener-messages',
    'Messages',
    'Open conversations and highlighted message threads.',
  ],
  [
    '/settings/account',
    'settings-account',
    'Settings / Account',
    'Manage identity, security, privacy and notifications.',
  ],
  [
    '/settings/artist',
    'settings-artist',
    'Settings / Artist',
    'Edit artist identity, branding, gallery and connections.',
  ],
  [
    '/settings/channel',
    'settings-channel',
    'Settings / Channel',
    'Configure channel details and public discovery.',
  ],
  [
    '/settings/broadcast',
    'settings-broadcast',
    'Settings / Broadcast',
    'Configure radio, green room and multicast destinations.',
  ],
  [
    '/settings/audience',
    'settings-audience',
    'Settings / Audience',
    'Manage tiers, subscriptions and grants.',
  ],
  [
    '/settings/themes',
    'settings-themes',
    'Settings / Themes',
    'Choose the visual language and appearance.',
  ],
  [
    '/settings/plugin-store',
    'settings-addons',
    'Settings / Add-ons',
    'Configure player, import, export and channel extensions.',
  ],
  [
    '/settings/whats-new',
    'settings-whats-new',
    'Settings / What’s new',
    'Read product changes and release notes.',
  ],
  [
    '/channel/demo',
    'public-channel-aurora',
    'Public channel / Aurora',
    'A public artist channel with the Aurora visualizer.',
  ],
  [
    '/radio/show/northern-lights',
    'public-radio-grid',
    'Public radio channel / Reactive Grid',
    'Listen to a live channel with a different visualizer preset.',
  ],
  [
    '/u/demo',
    'public-artist',
    'Artist profile',
    'See the artist identity, story, people and public catalogue.',
  ],
  [
    '/governance',
    'governance',
    'Governance',
    'Review proposals, voting and community decisions.',
  ],
  [
    '/help',
    'help-center',
    'Help center',
    'Find guidance for listening, publishing and broadcasting.',
  ],
  [
    '/status',
    'platform-status',
    'Platform status',
    'Check service health and operational status.',
  ],
  [
    '/studio',
    'studio-overview',
    'Studio / Overview',
    'See channel health, upcoming shows and work that needs attention.',
  ],
  [
    '/studio/branding',
    'studio-branding',
    'Studio / Branding',
    'Design channel look, artwork and public presentation.',
  ],
  [
    '/studio/stats',
    'studio-stats-overview',
    'Studio / Stats / Overview',
    'Review audience and catalogue performance at a glance.',
  ],
  [
    '/studio/stats?tab=plays',
    'studio-stats-plays',
    'Studio / Stats / Plays & listeners',
    'Compare plays, listeners and activity over time.',
  ],
  [
    '/studio/stats?tab=top-lists',
    'studio-stats-top-lists',
    'Studio / Stats / Top lists',
    'Inspect top tracks, countries and content types.',
  ],
  [
    '/studio/updates',
    'studio-posts',
    'Studio / Posts',
    'Publish updates and manage newsletter communication.',
  ],
  [
    '/studio/distribution',
    'studio-distribution',
    'Studio / Distribution',
    'Prepare catalogue delivery to external services.',
  ],
  [
    '/studio/insights',
    'studio-insights',
    'Studio / Insights',
    'Review track and catalogue insights.',
  ],
  [
    '/studio/revenue',
    'studio-audience',
    'Studio / Audience',
    'Manage audience relationships and fan revenue.',
  ],
  [
    '/studio/stripe',
    'studio-stripe',
    'Studio / Stripe',
    'Connect payouts and review subscription billing setup.',
  ],
  [
    '/studio/sounds',
    'studio-sounds',
    'Studio / Library / Sounds',
    'Filter, sort, play and edit sound content.',
  ],
  [
    '/studio/sounds?folder=clips',
    'studio-clips',
    'Studio / Library / Clips',
    'Manage short clips and radio announcements.',
  ],
  [
    '/library/collections',
    'studio-collections',
    'Studio / Library / Collections',
    'Create and browse organized collections.',
  ],
  [
    '/studio/releases',
    'studio-releases',
    'Studio / Library / Releases',
    'Manage singles, EPs and albums.',
  ],
  [
    '/studio/recordings',
    'studio-recordings',
    'Studio / Library / Recordings',
    'Polish and publish broadcast recordings.',
  ],
  [
    '/library/upload',
    'studio-upload',
    'Studio / Library / Upload',
    'Add tracks, releases, clips and imports.',
  ],
  [
    '/studio/editor',
    'studio-editor',
    'Studio / Library / Editor',
    'Open an audio session or import from the library.',
  ],
  [
    '/studio/stash',
    'studio-stash',
    'Studio / Library / Stash',
    'Keep private content out of the public catalogue.',
  ],
  [
    '/studio/go-live',
    'studio-go-live',
    'Studio / Perform / Go live',
    'Run pre-flight, rotation and live broadcast controls.',
  ],
  [
    '/studio/schedule',
    'studio-schedule',
    'Studio / Perform / Schedule',
    'Plan broadcasts and inspect analytics.',
  ],
  [
    '/studio/events',
    'studio-events',
    'Studio / Perform / Events',
    'Manage upcoming and past events.',
  ],
  [
    '/studio/events/new',
    'studio-event-new',
    'Studio / Perform / New event',
    'Create an event with venue, ticket and artwork details.',
  ],
  [
    '/studio/venues',
    'studio-venues',
    'Studio / Perform / Venues',
    'Browse and manage venue directory entries.',
  ],
  [
    '/studio/shows',
    'studio-shows',
    'Studio / Perform / Shows',
    'Manage single shows and continuing series.',
  ],
  [
    '/studio/shows/show-series-demo',
    'studio-show-detail',
    'Studio / Perform / Show detail',
    'Review show metadata, episodes and recordings.',
  ],
  [
    '/studio/channel',
    'studio-channel',
    'Studio / Manage / Channel',
    'Edit channel information and channel wizard access.',
  ],
  [
    '/studio/channel?tab=radio',
    'studio-radio',
    'Studio / Manage / Radio',
    'Control stream statistics and 24/7 rotation.',
  ],
  [
    '/studio/channel?tab=green-room',
    'studio-green-room',
    'Studio / Manage / Green room',
    'Configure the broadcast preparation space.',
  ],
  [
    '/studio/channel?tab=multicast',
    'studio-multicast',
    'Studio / Manage / Multicast',
    'Activate configured stream destinations.',
  ],
  [
    '/studio/channel?tab=selects',
    'studio-selects',
    'Studio / Manage / Tahti Selects',
    'Curate the community rotation.',
  ],
  [
    '/studio/moderation',
    'studio-moderation',
    'Studio / Manage / Moderation',
    'Assign moderators and review channel queues.',
  ],
  [
    '/admin',
    'admin-overview',
    'Admin / Overview',
    'Monitor platform needs action, streams and system status.',
  ],
  [
    '/admin/status',
    'admin-status',
    'Admin / Status',
    'View platform health alongside operational data.',
  ],
  [
    '/admin/logs',
    'admin-logs',
    'Admin / Logs / Activity',
    'Inspect operational activity.',
  ],
  [
    '/admin/logs?tab=containers',
    'admin-logs-containers',
    'Admin / Logs / Containers',
    'Inspect container and service logs.',
  ],
  [
    '/admin/logs?tab=recent-audit',
    'admin-logs-audit',
    'Admin / Logs / Recent audit',
    'Review recent privileged actions and context.',
  ],
  [
    '/admin/moderation',
    'admin-moderation',
    'Admin / Moderation / Support',
    'Triage moderation queues.',
  ],
  [
    '/admin/moderation/beta',
    'admin-moderation-beta',
    'Admin / Moderation / Beta applications',
    'Review beta applications.',
  ],
  [
    '/admin/moderation/radio-submissions',
    'admin-moderation-radio',
    'Admin / Moderation / Radio submissions',
    'Review Tahti Radio submissions.',
  ],
  [
    '/admin/moderation/content-reports',
    'admin-moderation-reports',
    'Admin / Moderation / Content reports',
    'Resolve content reports.',
  ],
  [
    '/admin/moderation/feature-requests',
    'admin-moderation-features',
    'Admin / Moderation / Feature requests',
    'Track product requests.',
  ],
  [
    '/admin/moderation/missed-shows',
    'admin-moderation-missed',
    'Admin / Moderation / Missed shows',
    'Resolve missed broadcast follow-up.',
  ],
  [
    '/admin/users',
    'admin-users',
    'Admin / Users',
    'Manage accounts and roles.',
  ],
  [
    '/admin/radio',
    'admin-radio',
    'Admin / Radio',
    'Manage station configuration.',
  ],
  [
    '/admin/news',
    'admin-news',
    'Admin / Posts',
    'Publish generic announcements.',
  ],
  [
    '/admin/streams',
    'admin-streams',
    'Admin / Streams',
    'Manage streams, listeners and controls.',
  ],
  [
    '/admin/top-lists',
    'admin-top-lists',
    'Admin / Top lists',
    'Explore platform listening rankings.',
  ],
  [
    '/admin/announcements',
    'admin-announcements',
    'Admin / Announcements',
    'Manage pinned and public announcements.',
  ],
  [
    '/admin/storage',
    'admin-storage',
    'Admin / Storage',
    'Review storage usage.',
  ],
  [
    '/admin/storage?tab=files',
    'admin-storage-files',
    'Admin / Storage / Files',
    'Inspect stored files.',
  ],
  [
    '/admin/financial',
    'admin-financial',
    'Admin / Financial',
    'Review platform financial summaries.',
  ],
  [
    '/admin/governance',
    'admin-governance',
    'Admin / Governance',
    'Review proposals, votes and discussion activity.',
  ],
  [
    '/admin/grants',
    'admin-grants',
    'Admin / Grants',
    'Manage grant cycles and awards.',
  ],
  [
    '/admin/agm',
    'admin-agm',
    'Admin / AGM',
    'Prepare and review annual meeting decisions.',
  ],
  [
    '/admin/vendors',
    'admin-vendors',
    'Admin / Vendors',
    'Manage platform vendors and integrations.',
  ],
  [
    '/admin/disco-widgets',
    'admin-widgets',
    'Admin / Widgets',
    'Catalog and configure discovery widgets.',
  ],
  [
    '/admin/i18n',
    'admin-i18n',
    'Admin / Localization',
    'Manage translated product content.',
  ],
  [
    '/admin/tahti-selects',
    'admin-selects',
    'Admin / Tahti Selects',
    'Curate the platform-wide selection.',
  ],
];

const VIEWPORT = { width: 1680, height: 1050 };

let browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
let page = await browser.newPage({ viewport: VIEWPORT });
await prepareCapturePage(page);
await page.emulateMedia({ reducedMotion: 'reduce' });

async function seedSession() {
  await page.goto(`${BASE}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.evaluate(
    ({ authState, layoutState, themeState }) => {
      localStorage.setItem('tahti-web-auth', JSON.stringify(authState));
      localStorage.setItem('tahti-web-layout', JSON.stringify(layoutState));
      localStorage.setItem('tahti-web-onboarded:mock-board-1', '1');
      // Spotify theme in CAPTURE_THEME_MODE (see lib/captureSetup.mjs).
      localStorage.setItem('tahti-web-theme', JSON.stringify(themeState));
      localStorage.setItem('tahti-nuclear-theme-id', themeState.state.themeId);
      localStorage.setItem(
        'tahti-nuclear-dark',
        themeState.state.dark ? '1' : '0',
      );
    },
    { authState: auth, layoutState: layout, themeState: CAPTURE_THEME_STATE },
  );
}

async function recreatePage() {
  if (!browser.isConnected()) {
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  }
  if (!page.isClosed()) {
    await page.close().catch(() => {});
  }
  page = await browser.newPage({ viewport: VIEWPORT });
  await prepareCapturePage(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedSession();
}

async function captureShot(imagePath) {
  try {
    await page.screenshot({ path: imagePath, fullPage: false, type: 'png' });
    return true;
  } catch {
    try {
      await page.screenshot({
        path: imagePath,
        fullPage: false,
        type: 'png',
        animations: 'disabled',
      });
      return true;
    } catch (error) {
      console.error(`screenshot failed: ${error.message}`);
      return false;
    }
  }
}

await seedSession();

const results = [];
for (const [path, file, title, narration] of routes) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  };
  try {
    if (page.isClosed()) {
      await recreatePage();
    }
    page.on('console', onConsole);
    await page.goto(`${BASE}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(800);
    const bodyText = await page.locator('body').innerText();
    const imagePath = join(outputDirectory, withThemeSuffix(`${file}.png`));
    const ok = await captureShot(imagePath);
    if (!ok) {
      await recreatePage();
      await page.goto(`${BASE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(800);
      await captureShot(imagePath);
    }
    results.push({
      path,
      file: `${file}.png`,
      id: file,
      title,
      narration,
      hasContent: bodyText.trim().length > 40,
      errors: errors.slice(0, 3),
    });
    console.log(`${file}: ${bodyText.trim().length} chars`);
  } catch (error) {
    console.error(`fail ${file}: ${error.message}`);
    results.push({
      path,
      file: `${file}.png`,
      id: file,
      title,
      narration,
      hasContent: false,
      errors: [error.message],
    });
    await recreatePage();
  } finally {
    page.off('console', onConsole);
  }
}

if (CAPTURE_THEME_MODE === 'light') {
  // The light run only adds `--light` images; the dark run writes the docs,
  // which reference both variants.
  await browser.close();
  console.log(`Captured ${results.length} light screenshots`);
  process.exit(0);
}

writeFileSync(
  join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);

const byId = new Map(results.map((result) => [result.id, result]));

const sectionFor = (title) => {
  if (title.startsWith('Admin /')) {
    return 'Administration';
  }
  if (title.startsWith('Studio /')) {
    return 'Artist studio';
  }
  if (
    title.startsWith('Public ') ||
    title === 'Governance' ||
    title === 'Help center' ||
    title === 'Platform status'
  ) {
    return 'Public channel and community';
  }
  return 'Listener and account';
};

const sectionOrder = [
  'Listener and account',
  'Public channel and community',
  'Artist studio',
  'Administration',
];

const gallerySections = new Map(sectionOrder.map((name) => [name, []]));
for (const result of results) {
  gallerySections.get(sectionFor(result.title)).push(result);
}

/** Dark capture by default; GitHub swaps in the `--light` capture for
 * viewers using a light theme. */
function largeImage(alt, relativePath) {
  const lightPath = relativePath.replace(/\.png$/, '--light.png');
  return `<picture><source media="(prefers-color-scheme: light)" srcset="${lightPath}" /><img src="${relativePath}" alt="${alt}" width="1680" /></picture>`;
}

const viewGuideLines = [
  '# Tahti web — full view guide',
  '',
  'Indexed gallery of every documented route capture. Screenshots are 1680×1050 viewport shots from the populated mock environment with the board account. The README keeps [feature highlights](../README.md#view-guide) only; this page is the complete index.',
  '',
  'Capture: [`scripts/capture-readme-guide.mjs`](../scripts/capture-readme-guide.mjs) · Manifest: [`readme-shots/manifest.json`](./readme-shots/manifest.json)',
  '',
  '## Contents',
  '',
];

for (const sectionName of sectionOrder) {
  const anchor = sectionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const entries = gallerySections.get(sectionName) ?? [];
  viewGuideLines.push(`- [${sectionName}](#${anchor}) (${entries.length})`);
}
viewGuideLines.push('');

for (const sectionName of sectionOrder) {
  const entries = gallerySections.get(sectionName) ?? [];
  if (entries.length === 0) {
    continue;
  }
  viewGuideLines.push(`## ${sectionName}`, '');
  viewGuideLines.push('| View | Path |', '| --- | --- |');
  for (const entry of entries) {
    const anchor = entry.id;
    viewGuideLines.push(`| [${entry.title}](#${anchor}) | \`${entry.path}\` |`);
  }
  viewGuideLines.push('');
  for (const entry of entries) {
    viewGuideLines.push(
      `### ${entry.title}`,
      '',
      `<a id="${entry.id}"></a>`,
      '',
      largeImage(entry.title, `./readme-shots/${entry.file}`),
      '',
      entry.narration,
      '',
      `\`${entry.path}\``,
      '',
    );
  }
}

writeFileSync(viewGuidePath, `${viewGuideLines.join('\n')}\n`);

const highlightMarkdown = [
  '## View guide',
  '',
  'Highlights of the main product jobs. Each image is a large 1680×1050 capture from the mock board account. The full indexed gallery of every documented view is in [`docs/VIEW-GUIDE.md`](./docs/VIEW-GUIDE.md) (manifest: [`docs/readme-shots/manifest.json`](./docs/readme-shots/manifest.json)).',
  '',
];

for (const highlight of HIGHLIGHTS) {
  highlightMarkdown.push(`### ${highlight.section}`, '', highlight.blurb, '');
  for (const fileId of highlight.files) {
    const entry = byId.get(fileId);
    if (!entry) {
      continue;
    }
    highlightMarkdown.push(
      `#### ${entry.title}`,
      '',
      largeImage(entry.title, `./docs/readme-shots/${entry.file}`),
      '',
      `${entry.narration} · [\`${entry.path}\`](./docs/VIEW-GUIDE.md#${entry.id})`,
      '',
    );
  }
  highlightMarkdown.push(
    `More in this area: see the [full view guide](./docs/VIEW-GUIDE.md).`,
    '',
  );
}

const existingReadme = readFileSync(readmePath, 'utf8');
const guideStart = existingReadme.indexOf('## View guide');
const addOnsStart = existingReadme.indexOf('\n## Add-ons');
if (guideStart === -1 || addOnsStart === -1) {
  throw new Error('README.md is missing the View guide or Add-ons anchors');
}
const nextReadme =
  existingReadme.slice(0, guideStart) +
  highlightMarkdown.join('\n') +
  existingReadme.slice(addOnsStart + 1);
writeFileSync(readmePath, nextReadme);

await browser.close();
const failed = results.filter((result) => !result.hasContent);
if (failed.length > 0) {
  console.error(
    `Screenshots with unexpectedly little content: ${failed.map((result) => result.file).join(', ')}`,
  );
  process.exitCode = 1;
}
console.log(`Updated ${readmePath}`);
console.log(`Updated ${viewGuidePath}`);
