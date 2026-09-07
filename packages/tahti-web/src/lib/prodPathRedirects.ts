/**
 * Production tahti.live path → Nuclear SPA path.
 * Used for cutover compatibility (emails, Stripe returns, bookmarks).
 */
export const DASHBOARD_REDIRECTS: Record<string, string> = {
  '': '/studio',
  broadcast: '/studio/go-live',
  archive: '/studio/sounds',
  upload: '/studio/upload',
  releases: '/studio/releases',
  collections: '/studio/collections',
  distribution: '/studio/distribution',
  editor: '/studio/editor',
  // Embeds page removed (no public consumer) — old bookmarks land on Releases.
  embeds: '/studio/releases',
  events: '/studio/events',
  venues: '/studio/venues',
  recordings: '/library/recordings',
  stash: '/library/stash',
  schedule: '/studio/schedule',
  stats: '/studio/stats',
  channel: '/studio/channel',
  'channel/edit': '/studio/branding?tab=channel-designer',
  'settings/media': '/studio/branding',
  'settings/presskit': '/studio/branding',
  'tahti-radio-slots': '/studio/shows',
  shows: '/studio/shows',
  playlists: '/studio/collections',
  newsletter: '/studio/updates',
  posts: '/studio/updates',
  updates: '/studio/updates',
  revenue: '/studio/revenue',
  messages: '/messages',
  'setup-channel': '/studio/channel?tab=setup',
  settings: '/settings',
  'settings/account': '/settings/account',
  'settings/artist-info': '/settings/artist',
  'settings/members': '/settings/artist',
  'settings/fan-subs': '/settings/money',
  'settings/connections': '/settings/connections',
  'settings/api': '/settings/connections',
  'settings/notifications': '/settings/account',
  'settings/domain': '/settings/channel',
  'settings/discovery': '/settings/widgets',
  'settings/internet-radio': '/settings/widgets',
  'settings/themes': '/settings/themes',
  'settings/announcements': '/settings/broadcast',
  'settings/green-room': '/settings/broadcast',
  'settings/distribution': '/studio/distribution',
  'settings/moderators': '/studio/moderation',
  'settings/multistream': '/studio/channel?tab=multicast',
  'upload/from-broadcast': '/library/recordings',
};

/** Resolve /dashboard/... rest path to Nuclear target, or /studio fallback. */
export function resolveDashboardRedirect(rest: string | undefined): string {
  const key = (rest ?? '').replace(/^\/+|\/+$/g, '');
  if (DASHBOARD_REDIRECTS[key]) {
    return DASHBOARD_REDIRECTS[key];
  }
  // Prefix matches (e.g. archive/:id → archive)
  const first = key.split('/')[0] ?? '';
  if (first === 'archive' && key.includes('/')) {
    const id = key.split('/')[1];
    if (id && key.endsWith('/editor')) {
      return `/studio/sounds/${id}/editor`;
    }
    return id ? `/studio/sounds/${id}` : '/studio/sounds';
  }
  if (first === 'releases' && key.includes('/')) {
    const id = key.split('/')[1];
    return id ? `/studio/releases/${id}` : '/studio/releases';
  }
  if (first === 'collections' && key.includes('/')) {
    const slug = key.split('/')[1];
    if (slug === 'new') {
      return '/studio/collections';
    }
    return slug ? `/studio/collections/${slug}` : '/studio/collections';
  }
  if (first === 'editor' && key.includes('/')) {
    const id = key.split('/')[1];
    return id ? `/studio/editor/${id}` : '/studio/editor';
  }
  if (first === 'stats' && key.includes('detail')) {
    return '/studio/stats/detail';
  }
  if (first === 'insights') {
    const [, kind, id] = key.split('/');
    if (kind && id) {
      return `/studio/insights/${kind}/${id}`;
    }
    return '/studio/stats';
  }
  if (first === 'moderate') {
    return '/studio/moderation';
  }
  if (DASHBOARD_REDIRECTS[first]) {
    return DASHBOARD_REDIRECTS[first];
  }
  return '/studio';
}
