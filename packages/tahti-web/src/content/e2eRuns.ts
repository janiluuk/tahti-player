import betaRun from './e2e/beta.json';
import mockRun from './e2e/mock.json';

export type E2eStatus =
  'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export type E2eStep = {
  image: string;
  caption: string;
  failed: boolean;
};

export type E2eTest = {
  id: string;
  file: string;
  line: number;
  title: string;
  status: E2eStatus;
  durationMs: number;
  error: string | null;
  steps: E2eStep[];
};

export type E2eTriageKind =
  'app-bug' | 'ux' | 'stale-spec' | 'blocked' | 'fixture';

export type E2eTriage = { kind: E2eTriageKind; note: string };

export type E2eRun = {
  id: string;
  label: string;
  baseUrl: string;
  capturedAt: string;
  summary: string;
  tests: E2eTest[];
  triage: Record<string, E2eTriage>;
};

type RunManifest = { baseUrl: string; tests: E2eTest[] };

export const E2E_TRIAGE_LABELS: Record<E2eTriageKind, string> = {
  'app-bug': 'App bug',
  ux: 'UX issue',
  'stale-spec': 'Stale spec',
  blocked: 'Blocked',
  fixture: 'Missing fixture',
};

const SETTINGS_MODAL_NOTE =
  'The route now opens the Settings modal (Channel & chat / Add-ons) instead of a Studio page, so the spec waits for a page that no longer exists.';

const MOCK_TRIAGE: Record<string, E2eTriage> = {
  'channel-designer-artist-look-spec-a-saved-backdrop-design-change-shows': {
    kind: 'stale-spec',
    note: SETTINGS_MODAL_NOTE,
  },
  'channel-designer-elements-spec-studio-branding-designer-lists-usable-a': {
    kind: 'stale-spec',
    note: SETTINGS_MODAL_NOTE,
  },
  'channel-designer-elements-spec-artist-page-designer-uses-the-element-m': {
    kind: 'stale-spec',
    note: 'The designer section picker is now a Select whose last option is "Background", not "Backdrop".',
  },
  'channel-designer-parity-spec-a-saved-backdrop-design-change-shows-up-o': {
    kind: 'stale-spec',
    note: SETTINGS_MODAL_NOTE,
  },
  'cutover-vital-spec-artist-can-sign-in-and-reach-broadcast-and-upload-t': {
    kind: 'ux',
    note: '"Record broadcast" is no longer on by default. Go live stacks 8 Studio tabs over 10 Broadcast sub-tabs that wrap ("Channel", "Radio" orphaned on a second row).',
  },
  'cutover-vital-spec-studio-dashboard-shows-clickable-summary-stats-and-': {
    kind: 'stale-spec',
    note: 'The dashboard heading is now "Studio", not a "Good morning, artist" greeting.',
  },
  'cutover-vital-spec-artist-library-starts-with-a-searchable-archive-and': {
    kind: 'ux',
    note: 'There is no "All sounds" link any more. Library has 10 tabs that wrap onto a second row (Smart links, Local files).',
  },
  'cutover-vital-spec-collections-combine-albums-eps-dj-sets-and-playlist': {
    kind: 'stale-spec',
    note: 'Collection type filters are now count chips (Albums 1, EPs 1…), not buttons.',
  },
  'cutover-vital-spec-artist-track-titles-open-details-while-row-controls': {
    kind: 'stale-spec',
    note: 'Clicking a track title opens the full track page instead of a "Track info" dialog.',
  },
  'cutover-vital-spec-hearthis-imports-report-completion-link-to-the-trac': {
    kind: 'stale-spec',
    note: 'hearthis import moved to Settings › Add-ons › Import, which shows "Nothing installed" — there is no "Import destination playlist" field.',
  },
  'cutover-vital-spec-admin-radio-recognises-rotation-playback-and-uses-t': {
    kind: 'fixture',
    note: 'The mock rotation now totals 10:34 (2 tracks), not 15:13.',
  },
  'cutover-vital-spec-branding-workspace-manages-an-avatar-public-gallery': {
    kind: 'ux',
    note: 'Branding opens Settings › Artist › Artist branding with an "Artist branding" heading; gallery / channel designer / multicast still live in separate places.',
  },
  'cutover-vital-spec-branding-and-radio-own-gallery-channel-designer-and': {
    kind: 'ux',
    note: 'Artist branding group is labeled; gallery, channel designer and multicast still live in three different places.',
  },
  'cutover-vital-spec-listen-chrome-lights-listen-on-child-tabs-and-favor': {
    kind: 'stale-spec',
    note: 'The signed-out empty state adds a "Sign in to see favorites" heading that also matches the name "Favorites", so the locator needs exact: true.',
  },
  'cutover-vital-spec-artist-creates-a-four-image-promotion-kit-and-anoth': {
    kind: 'ux',
    note: 'Promotion kit lives under Settings › Artist › Artist branding (press kit / gallery); still modal Settings rather than a dedicated page.',
  },
  'cutover-vital-spec-admin-user-profile-includes-identity-details-and-an': {
    kind: 'stale-spec',
    note: 'The role filter is a custom Select whose options only mount once it is opened (Board does exist).',
  },
  'cutover-vital-spec-listener-can-open-a-fan-subscription-offer': {
    kind: 'ux',
    note: 'The subscribe page has no "Subscribe to …" heading — only the artist name — and "Log in" / "Join" are bare inline text, not buttons.',
  },
  'fan-sub-and-track-purchase-spec-subscriber-and-track-purchase-both-get': {
    kind: 'blocked',
    note: 'Needs TAHTI_E2E_RIFF_WAV plus fan-sub and fan-buy accounts; times out at 180 s without them.',
  },
  'layout-stability-spec-studio-shell-stays-full-width-and-keeps-navigati': {
    kind: 'stale-spec',
    note: '[data-studio-section-menu] is gone; the spec needs the current Studio nav selector.',
  },
  'layout-stability-spec-admin-shell-stays-full-width-and-keeps-navigatio': {
    kind: 'ux',
    note: 'Admin selectors are gone (stale spec). Admin › Moderation stacks four rows of tabs (Overview/Community… › Moderation/Users… › Support/Beta… › All/Needs reply…), and the ticket list truncates titles to "Cannot con…".',
  },
  'layout-stability-spec-studio-and-admin-shells-remain-reachable-on-mobi': {
    kind: 'stale-spec',
    note: '[data-studio-section-menu] is gone; on mobile the Library tabs scroll off to the right with only an icon visible.',
  },
  'listener-purchase-flow-spec-listener-buys-a-track-sees-it-in-purchases': {
    kind: 'stale-spec',
    note: 'The mock API no longer exports setSoundPurchaseAccess.',
  },
  'listener-purchase-flow-spec-listener-subscribes-sees-it-in-your-subs-c': {
    kind: 'fixture',
    note: 'After cancelling, the "demo" subscription row shows "Ends on 11/18/2026" — no "cancels" wording.',
  },
  'plugin-store-spec-studio-go-live-multistream-every-api-supported-provi': {
    kind: 'ux',
    note: 'Multistream / green room cross-link Settings ↔ Studio › Broadcast; defaults stay in Settings, live session in Studio.',
  },
  'plugin-store-spec-settings-connections-export-targets-render-from-the-': {
    kind: 'stale-spec',
    note: 'There is no "Export music" section in Settings › Account any more.',
  },
  'plugin-store-spec-plugin-store-explains-categories-previews-themes-and': {
    kind: 'ux',
    note: 'Each Add-ons row has Activate + a power toggle + a gear for the same add-on, plus two unexplained stacked (i) buttons; no theme colour preview is rendered.',
  },
  'plugin-store-spec-listen-add-widget-dialog-lists-every-listen-store-ad': {
    kind: 'stale-spec',
    note: 'The dialog is now titled "Add Listen widgets".',
  },
  'plugin-store-spec-listen-add-widget-picker-installs-configures-and-uni': {
    kind: 'stale-spec',
    note: 'hearthis.at configure expands inline in the picker; Uninstall is in the card header actions.',
  },
  'plugin-store-spec-settings-add-ons-listen-tab-can-add-and-remove-a-wid': {
    kind: 'stale-spec',
    note: 'Settings › Add-ons opens on Listener › Radio; the "listener widgets on your Listen page" dialog copy is gone.',
  },
  'radio-cover-spec-admin-can-replace-a-radio-cover-and-see-it-persist': {
    kind: 'stale-spec',
    note: SETTINGS_MODAL_NOTE,
  },
  'radio-cover-spec-non-admins-do-not-see-the-radio-cover-edit-control': {
    kind: 'stale-spec',
    note: SETTINGS_MODAL_NOTE,
  },
  'real-user-journeys-spec-library-is-a-studio-tab-and-keeps-library-rout': {
    kind: 'stale-spec',
    note: 'Library is its own sidebar section now, not a Studio tab — there is no "Studio pages" nav on /library.',
  },
  'real-user-journeys-spec-artist-stats-show-real-listen-minutes-and-the-': {
    kind: 'stale-spec',
    note: 'The listener world map moved to the "Plays & listeners" sub-tab of Stats.',
  },
  'real-user-journeys-spec-stream-manager-stopping-a-live-broadcast-requi': {
    kind: 'stale-spec',
    note: 'Go live (Prep) no longer has a "Start rotation" button.',
  },
};

const UPLOAD_VALIDATION_NOTE =
  'Uploading the fixture WAV on beta shows a bare "Validation error" under Upload and never creates the sound, so the flow stops before /studio/sounds/$id.';

const BETA_TRIAGE: Record<string, E2eTriage> = {
  'plugin-store-spec-radio-visualizer-renders-through-the-registry-with-n': {
    kind: 'app-bug',
    note: '/radio on beta logs a CSP violation (inline script blocked by script-src) and three 401 responses for a signed-out visitor. The CSP half is fixed on master (#1148, /theme-boot.js) but not deployed yet.',
  },
  'real-user-journeys-spec-a-new-account-can-complete-registration-and-im': {
    kind: 'app-bug',
    note: 'Join on beta answers with a bare "Validation error" that names no field; the account is not created. Master (#1148) now shows the failing field, but beta has not picked it up yet.',
  },
  'listener-purchase-flow-spec-listener-buys-a-track-sees-it-in-purchases': {
    kind: 'app-bug',
    note: UPLOAD_VALIDATION_NOTE,
  },
  'fan-sub-and-track-purchase-spec-subscriber-and-track-purchase-both-get': {
    kind: 'app-bug',
    note: UPLOAD_VALIDATION_NOTE,
  },
  'stash-and-subscriber-access-spec-a-public-sound-is-playable-and-downlo': {
    kind: 'app-bug',
    note: UPLOAD_VALIDATION_NOTE,
  },
  'stash-and-subscriber-access-spec-a-private-sound-is-hidden-from-the-pu': {
    kind: 'blocked',
    note: 'Sign-in succeeded, but /studio/upload then showed the signed-out Studio wall, so there was no file input to upload into.',
  },
  'listener-purchase-flow-spec-listener-subscribes-sees-it-in-your-subs-c': {
    kind: 'stale-spec',
    note: 'The spec imports /src/api/studio-extras.ts in the page, which only exists on the Vite dev server, not on a built deploy.',
  },
  'layout-stability-spec-admin-shell-stays-full-width-and-keeps-navigatio': {
    kind: 'stale-spec',
    note: "The spec's own signIn() navigates before the session lands, so every admin route shows the Board admin login wall.",
  },
  'cutover-vital-spec-admin-user-profile-includes-identity-details-and-an': {
    kind: 'ux',
    note: 'The admin user page has three controls labelled "Role", so getByLabel(\'Role\') cannot tell them apart — neither can a screen reader.',
  },
  'cutover-vital-spec-listener-can-open-a-fan-subscription-offer': {
    kind: 'ux',
    note: 'northern-lights on beta has no fan tiers and payments are not set up; the "Subscribe to …" heading never renders.',
  },
  'real-user-journeys-spec-governance-public-history-and-historical-grant': {
    kind: 'ux',
    note: 'Public governance history shows junk test data ("sjsj" / "jddkkfk") and no "Confirm annual report" grant report.',
  },
};

const BETA_FIXTURE_NOTE: E2eTriage = {
  kind: 'fixture',
  note: 'Looks for seeded mock data (tracks, motions, archive ids, stat values) that the beta account does not have.',
};

function betaTriage(tests: E2eTest[]): Record<string, E2eTriage> {
  const mockFailed = new Set(
    (mockRun as RunManifest).tests
      .filter((t) => t.status !== 'passed')
      .map((t) => t.id),
  );
  const triage: Record<string, E2eTriage> = {};
  for (const t of tests) {
    if (t.status === 'passed') {
      continue;
    }
    const fromMock = mockFailed.has(t.id) ? MOCK_TRIAGE[t.id] : undefined;
    triage[t.id] = BETA_TRIAGE[t.id] ?? fromMock ?? BETA_FIXTURE_NOTE;
  }
  return triage;
}

export const E2E_RUNS: E2eRun[] = [
  {
    id: 'mock',
    label: 'Local mock',
    baseUrl: (mockRun as RunManifest).baseUrl,
    capturedAt: '2026-10-19',
    summary:
      'Full suite against the dev server with VITE_FORCE_MOCK=1 — the default artist@tahti.live login works, so signed-in flows get past the login step.',
    tests: (mockRun as RunManifest).tests,
    triage: MOCK_TRIAGE,
  },
  {
    id: 'beta',
    label: 'beta.tahti.live',
    baseUrl: (betaRun as RunManifest).baseUrl,
    capturedAt: '2026-10-19',
    summary:
      'Full suite against the deployed beta, signed in with a real account (TAHTI_E2E_EMAIL / TAHTI_E2E_PASSWORD) after the API gave logins their own rate-limit bucket — no sign-in failures and no 429s. Beta still serves the 18 Oct build (its deploy has failed since #1147), so fixes from #1148 are not in these shots; most other failures look for mock fixture data the account does not have.',
    tests: (betaRun as RunManifest).tests,
    triage: betaTriage((betaRun as RunManifest).tests),
  },
];
