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
    note: 'Branding is three levels deep inside the Settings modal (Artist › Visuals › Branding), with no "Artist branding" heading — hard to find and easy to lose.',
  },
  'cutover-vital-spec-branding-and-radio-own-gallery-channel-designer-and': {
    kind: 'ux',
    note: 'The "Branding" tab is now nested under Settings › Artist › Visuals; gallery, channel designer and multicast live in three different places.',
  },
  'cutover-vital-spec-listen-chrome-lights-listen-on-child-tabs-and-favor': {
    kind: 'stale-spec',
    note: 'The signed-out empty state adds a "Sign in to see favorites" heading that also matches the name "Favorites", so the locator needs exact: true.',
  },
  'cutover-vital-spec-artist-creates-a-four-image-promotion-kit-and-anoth': {
    kind: 'ux',
    note: 'The promotion kit sits under the same three-level Settings › Artist › Visuals path, so there is no "Artist branding" page to start from.',
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
    note: 'Multistream providers moved to Settings › Broadcast. Broadcast setup is split between Studio › Broadcast and Settings › Broadcast, with Radio and Green room in both.',
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
    kind: 'ux',
    note: 'Configuring hearthis.at opens a second dialog stacked over the picker, with an orphaned "Uninstall" text button at the bottom.',
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

const BETA_TRIAGE: Record<string, E2eTriage> = {
  'plugin-store-spec-radio-visualizer-renders-through-the-registry-with-n': {
    kind: 'app-bug',
    note: '/radio on beta logs a CSP violation (inline script blocked by script-src) and three 401 responses for a signed-out visitor.',
  },
  'cutover-vital-spec-listener-can-open-a-fan-subscription-offer': {
    kind: 'ux',
    note: 'northern-lights on beta has no fan tiers and payments are not set up; the heading falls back to the slug.',
  },
  'real-user-journeys-spec-governance-public-history-and-historical-grant': {
    kind: 'ux',
    note: 'Public governance history shows junk test data ("sjsj" / "jddkkfk") and no "Confirm annual report" grant report.',
  },
};

function betaTriage(tests: E2eTest[]): Record<string, E2eTriage> {
  const triage: Record<string, E2eTriage> = {};
  for (const t of tests) {
    if (t.error?.includes('Signed in as')) {
      triage[t.id] = {
        kind: 'blocked',
        note: 'Beta rejects the default artist@tahti.live / demo-password login — rerun with TAHTI_E2E_PASSWORD (and the matching account) to get past sign-in.',
      };
    }
  }
  return { ...triage, ...BETA_TRIAGE };
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
      'Full suite against the deployed beta without TAHTI_E2E_PASSWORD — beta rejects the default artist@tahti.live / demo-password login, so signed-in specs stop at the login dialog.',
    tests: (betaRun as RunManifest).tests,
    triage: betaTriage((betaRun as RunManifest).tests),
  },
];
