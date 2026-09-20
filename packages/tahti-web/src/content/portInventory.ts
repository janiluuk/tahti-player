/**
 * Structured port / mock inventory for the Tahti map (`/more`).
 * Keep in sync with TAHTI-PORT-CHECKLIST.md + FEATURES.md + MOCKS.md.
 */

export type PortStatus =
  | 'done'
  | 'partial'
  | 'missing'
  | 'mock-only'
  | 'unwired'
  | 'link-out'
  | 'out-of-scope';

export type PortInventoryItem = {
  id: string;
  surface: string;
  /** Nuclear / beta route when present */
  route?: string;
  status: PortStatus;
  detail: string;
  /** Anchor id on /more for deep-links */
  section?: 'backlog' | 'mock' | 'gap';
};

export const PORT_STATUS_LABEL: Record<PortStatus, string> = {
  done: 'Done',
  partial: 'Partial',
  missing: 'Missing',
  'mock-only': 'Mock-only',
  unwired: 'Unwired',
  'link-out': 'Link-out',
  'out-of-scope': 'Out of scope',
};

/** Priority backlog from TAHTI-PORT-CHECKLIST.md (unchecked = still open). */
export const PORT_BACKLOG: PortInventoryItem[] = [
  {
    id: 'mobile-chrome',
    surface: 'Mobile listen chrome',
    route: '/',
    status: 'partial',
    detail:
      'Phone shell: bottom nav, drawers, compact player, icon play/queue with hint captions. Keep polishing studio forms on narrow screens.',
    section: 'backlog',
  },
  {
    id: 'chat-hardening',
    surface: 'Channel chat hardening',
    route: '/channel/$slug',
    status: 'done',
    detail:
      'hCaptcha and rail parity shipped earlier; a real join/send failure outside FORCE_MOCK now fails closed instead of echoing locally as if delivered.',
    section: 'backlog',
  },
  {
    id: 'sources-oauth',
    surface: 'Sources OAuth polish',
    route: '/settings/plugin-store?category=import',
    status: 'done',
    detail:
      'Live provider start URLs and all production callback return shapes land on the matching in-client source with visible result messaging.',
    section: 'backlog',
  },
  {
    id: 'stash-share',
    surface: 'Stash share links',
    route: '/library/stash',
    status: 'done',
    detail: 'Grant expiring read/download access and revoke active shares.',
    section: 'backlog',
  },
  {
    id: 'membership-purchase',
    surface: 'Membership purchase',
    route: '/signup/payment',
    status: 'done',
    detail: 'Stripe membership checkout with mock activation under FORCE_MOCK.',
    section: 'backlog',
  },
  {
    id: 'studio-extras',
    surface: 'Distribution / radio slots / moderate',
    route: '/studio',
    status: 'done',
    detail: 'Live API-backed Studio surfaces are available in this client.',
    section: 'backlog',
  },
  {
    id: 'visualizer-presets',
    surface: 'Full Three.js visualizer presets',
    route: '/channel/$slug',
    status: 'done',
    detail:
      'All ten production preset names render distinct analyser-reactive Three.js scenes from a lazy chunk, including the ambient channel-page layer and hero visualizer.',
    section: 'backlog',
  },
  {
    id: 'multitrack',
    surface: 'Multitrack timeline editing',
    route: '/studio/editor',
    status: 'partial',
    detail: 'Editor is EQ/markers/stems lite — not full multitrack.',
    section: 'backlog',
  },
  {
    id: 'member-invites',
    surface: 'Channel member invites',
    route: '/studio/moderation',
    status: 'missing',
    detail:
      'Adding a moderator by existing username is live-API and done (`/studio/moderation`). A genuine email invite — for someone without a Tahti account yet, with an accept-token flow — is a separate, larger feature with no backing API; not clearly needed given the username flow already covers the common case.',
    section: 'backlog',
  },
  {
    id: 'listener-dashboard',
    surface: 'Listener-only dashboard',
    route: '/library',
    status: 'done',
    detail: 'Non-artist /dashboard sessions route to the in-client library.',
    section: 'backlog',
  },
  {
    id: 'cutover',
    surface: 'Production cutover',
    status: 'missing',
    detail: 'Replace apps/web listen/studio with this client.',
    section: 'backlog',
  },
  {
    id: 'disco-widgets',
    surface: 'Disco-widgets',
    route: '/settings/widgets',
    status: 'done',
    detail:
      'Listener and artist store, sandboxed iframe renderer, Listen/channel/profile mounts. Admin catalog stays on Next /admin.',
    section: 'backlog',
  },
];

/** Mock / stub / unwired inventory rows. */
export const PORT_MOCK_INVENTORY: PortInventoryItem[] = [
  {
    id: 'force-mock',
    surface: 'VITE_FORCE_MOCK whole app',
    status: 'mock-only',
    detail: 'Full fixture session — demos only; never default in prod.',
    section: 'mock',
  },
  {
    id: 'mock-fallback',
    surface: 'Dev silent mock fallback',
    status: 'mock-only',
    detail:
      'When API down + VITE_ALLOW_MOCK_FALLBACK (default on in Vite dev). Set 0 for strict live.',
    section: 'mock',
  },
  {
    id: 'preview-demo',
    surface: 'Spotify / SoundCloud stream URLs',
    route: '/settings/plugin-store?category=import',
    status: 'partial',
    detail:
      'Always DEMO_MP3, live or mock — neither API exposes a real per-track preview here. Play/Queue rows now say so explicitly instead of implying real audio.',
    section: 'mock',
  },
  {
    id: 'chat-mock',
    surface: 'Channel chat',
    route: '/chat/$slug',
    status: 'partial',
    detail:
      'Local mock send only under FORCE_MOCK; live join failure fails closed.',
    section: 'mock',
  },
  {
    id: 'themes',
    surface: 'Themes',
    route: '/settings/themes',
    status: 'mock-only',
    detail: 'Nuclear local presets — not a Tahti API.',
    section: 'mock',
  },
  {
    id: 'help-legal',
    surface: 'Help / legal',
    route: '/help',
    status: 'partial',
    detail:
      'Static help hub, Disco-widgets guide, and Artist gallery how-to. Support form is in-client.',
    section: 'mock',
  },
  {
    id: 'settings-linkout',
    surface: 'Settings extras',
    route: '/settings',
    status: 'link-out',
    detail:
      'True email invites for people without an account have no backing API. Existing-user moderation and press-kit gallery management are in-client.',
    section: 'mock',
  },
  {
    id: 'favorites-local',
    surface: 'Favorites / history',
    route: '/favorites',
    status: 'partial',
    detail:
      'Listen Favorites and History persist in localStorage per account. Followed artists merge from GET /api/me/following; there is no server favorites library yet.',
    section: 'mock',
  },
  {
    id: 'pro-editor',
    surface: 'Pro editor',
    route: '/studio/editor',
    status: 'partial',
    detail: 'Partial vs prod multitrack.',
    section: 'mock',
  },
  {
    id: 'feature-map',
    surface: 'Feature map / Screen atlas',
    route: '/more',
    status: 'mock-only',
    detail: 'Doc chrome for this map page.',
    section: 'mock',
  },
  {
    id: 'board-admin',
    surface: 'Board /admin/*',
    status: 'partial',
    detail: '22 organized, API-backed admin surfaces are available in-client.',
    section: 'mock',
  },
];

/** High-level gap matrix highlights (not every FEATURES row). */
export const PORT_GAP_HIGHLIGHTS: PortInventoryItem[] = [
  {
    id: 'gap-green-room',
    surface: 'Green room',
    route: '/u/$username/green-room',
    status: 'done',
    detail: 'Guest preview and broadcast prefs are live-API.',
    section: 'gap',
  },
  {
    id: 'gap-password',
    surface: 'Password recovery / setup-password',
    route: '/settings/account',
    status: 'done',
    detail: 'Setup, forgot/reset-password, and TOTP management are in-client.',
    section: 'gap',
  },
  {
    id: 'gap-venues-register',
    surface: 'Venue register',
    route: '/venues/register',
    status: 'done',
    detail: 'POST /api/v1/venues (wave 7).',
    section: 'gap',
  },
  {
    id: 'gap-totp',
    surface: 'Account TOTP',
    route: '/settings/account',
    status: 'done',
    detail: '/api/me/totp/* in Settings → Account.',
    section: 'gap',
  },
  {
    id: 'gap-stats-plays',
    surface: 'Stats plays series',
    route: '/studio/stats',
    status: 'done',
    detail: 'GET /api/me/stats/plays — map viz still optional.',
    section: 'gap',
  },
  {
    id: 'gap-stash-upload',
    surface: 'Stash upload / delete',
    route: '/library/stash',
    status: 'done',
    detail:
      'Prepare → PUT → register, delete, share, and revoke are in-client.',
    section: 'gap',
  },
  {
    id: 'gap-press-kit-gallery',
    surface: 'Press-kit gallery',
    route: '/settings/artist?tab=gallery',
    status: 'done',
    detail:
      '/api/me/press-kit/images/* upload/delete; ArtistGalleryPanel wired into Settings → Artist → Gallery.',
    section: 'gap',
  },
];

export function countByStatus(
  items: PortInventoryItem[],
): Partial<Record<PortStatus, number>> {
  const out: Partial<Record<PortStatus, number>> = {};
  for (const item of items) {
    out[item.status] = (out[item.status] ?? 0) + 1;
  }
  return out;
}
