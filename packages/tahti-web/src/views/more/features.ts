import { type MapParity } from '../../content/mapScreens';

export type Status =
  'live' | 'partial' | 'missing' | 'stub' | 'studio' | 'admin';

export type FeatureRow = {
  feature: string;
  tahti: string;
  nuclear: string;
  status: Status;
  notes?: string;
};

export function isAbsentSurface(value: string): boolean {
  const v = value.trim();
  return v === '' || v === '—' || v === '-';
}

export function featureParity(row: FeatureRow): MapParity {
  const noTahti = isAbsentSurface(row.tahti);
  const noNuclear = isAbsentSurface(row.nuclear);
  if (noTahti && !noNuclear) {
    return 'nuclear-only';
  }
  if (!noTahti && noNuclear) {
    return 'tahti-only';
  }
  return 'both';
}

export const STATUS_LABEL: Record<Status, string> = {
  live: 'Live in POC',
  partial: 'Partial parity',
  missing: 'Missing in POC',
  stub: 'Stub / deep-link',
  studio: 'Studio-only (out of scope)',
  admin: 'Admin-only (out of scope)',
};

export const FEATURES: FeatureRow[] = [
  {
    feature: 'Listen directory',
    tahti: '/listen',
    nuclear: '/',
    status: 'live',
    notes: 'Search + genre chips from directory genres',
  },
  {
    feature: 'Channel live',
    tahti: '/c/:slug',
    nuclear: '/channel/$slug',
    status: 'live',
    notes: 'GET /api/channels/:slug + HLS',
  },
  {
    feature: 'Channel archive library',
    tahti: '/c/:slug (archive)',
    nuclear: '/channel/$slug',
    status: 'live',
    notes: 'TrackTable + listen-events after ~15s',
  },
  {
    feature: 'Tahti Radio',
    tahti: '/radio',
    nuclear: '/radio',
    status: 'live',
    notes: 'GET /api/channels/tahti-radio + /api/v1/radio/recently-played',
  },
  {
    feature: 'Artist profile',
    tahti: '/u/:username',
    nuclear: '/u/$username',
    status: 'live',
    notes: 'GET /api/v1/u/:username/profile',
  },
  {
    feature: 'Collections',
    tahti: '/u/:user/c/:slug',
    nuclear: '/u/$username/c/$slug',
    status: 'live',
    notes: 'GET /api/v1/collections/:slug',
  },
  {
    feature: 'Smart link release',
    tahti: '/r/:slug',
    nuclear: '/r/$slug',
    status: 'live',
    notes: 'GET /api/v1/r/:slug',
  },
  {
    feature: 'Library',
    tahti: 'follows + local history',
    nuclear: '/library (+ /library/history)',
    status: 'live',
    notes: 'Sparse sidebar; Favorites | History tabs',
  },
  {
    feature: 'Sources',
    tahti: 'dashboard import / OAuth',
    nuclear: '/settings/plugin-store?category=import',
    status: 'live',
    notes:
      'Configures inline in Settings → Add-ons → Import (no separate page); /sources and /sources/$id redirect here',
  },
  {
    feature: 'Go Live',
    tahti: '/dashboard/broadcast',
    nuclear: '/studio/go-live',
    status: 'live',
    notes: 'OBS/Icecast keys, signal, go-live, multistream tab',
  },
  {
    feature: 'Settings (Nuclear-style)',
    tahti: '/dashboard/settings/*',
    nuclear: '/settings, /settings/$section',
    status: 'live',
    notes:
      'Account · Artist · Channel & design · Broadcast · Money · Notifications · Themes · Connections',
  },
  {
    feature: 'Themes',
    tahti: 'brand tokens',
    nuclear: '/settings/themes (was /themes)',
    status: 'live',
    notes: '@tahti-player/themes presets under Settings',
  },
  {
    feature: 'Venues directory',
    tahti: '/venues',
    nuclear: '/venues',
    status: 'live',
    notes: 'GET /api/v1/venues — list only',
  },
  {
    feature: 'Channel chat',
    tahti: '/c/:slug chat',
    nuclear: '/chat, /chat/$slug, channel tabs',
    status: 'live',
    notes: 'REST + Centrifugo + hCaptcha + emoji react API',
  },
  {
    feature: 'Studio schedule / programme',
    tahti: '/dashboard schedule + programme',
    nuclear: '/studio/schedule',
    status: 'live',
    notes: 'nextBroadcast + fallback toggles',
  },
  {
    feature: 'Studio stats',
    tahti: '/dashboard/stats',
    nuclear: '/studio/stats',
    status: 'live',
    notes: 'summary + top tracks/countries; ledger via /studio/audience lite',
  },
  {
    feature: 'Studio channel settings',
    tahti: '/dashboard/settings/* + channel/edit',
    nuclear: '/settings/channel',
    status: 'live',
    notes: 'Design | Profile | Username/domain',
  },
  {
    feature: 'Studio updates',
    tahti: 'posts + newsletter',
    nuclear: '/studio/updates',
    status: 'live',
    notes: 'Posts + draft create + send',
  },
  {
    feature: 'Profile channel designer',
    tahti: '/dashboard/channel/edit',
    nuclear: '/u/$username Design tab (owner)',
    status: 'live',
    notes: 'visual/preset/accent live preview; Studio Channel full editor',
  },
  {
    feature: 'DMs',
    tahti: 'messages',
    nuclear: '/messages',
    status: 'live',
    notes: 'Inbox + thread',
  },
  {
    feature: 'Revenue lite',
    tahti: 'fan-subs connect + grants',
    nuclear: '/studio/audience',
    status: 'live',
    notes:
      'Orders, grants, and a link to the Stripe dashboard when Stripe is on',
  },
  {
    feature: 'Stripe dashboard',
    tahti: 'Connect portal / Express login',
    nuclear: '/studio/stripe',
    status: 'live',
    notes: 'Studio nav item only when stripeConfigured is true',
  },
  {
    feature: 'Release create + artwork',
    tahti: '/dashboard/releases',
    nuclear: '/studio/releases',
    status: 'live',
    notes: 'POST create + artwork prepare/complete',
  },
  {
    feature: 'Fan subscribe',
    tahti: '/u/:user/subscribe',
    nuclear: '/subscribe/$username',
    status: 'live',
    notes: 'Tiers + checkout URL',
  },
  {
    feature: 'Transparency',
    tahti: '/transparency',
    nuclear: '/transparency',
    status: 'live',
    notes: 'YTD / grants / ledger',
  },
  {
    feature: 'Platform status',
    tahti: '/status',
    nuclear: '/admin/status',
    status: 'live',
    notes: 'Merged into Admin → Status with service, queue, and cron data',
  },
  {
    feature: 'About / legal',
    tahti: '/about, /terms, /privacy, /agpl',
    nuclear: 'same paths',
    status: 'live',
    notes: 'POC copy + links to production',
  },
  {
    feature: 'Governance',
    tahti: '/governance',
    nuclear: '/governance',
    status: 'live',
    notes: 'Motions list when member; otherwise gated',
  },
  {
    feature: 'Account + membership',
    tahti: '/dashboard/settings/account',
    nuclear: '/settings/account',
    status: 'live',
    notes: 'Session, membership, fan subs under Money',
  },
  {
    feature: 'Studio overview',
    tahti: '/dashboard',
    nuclear: '/studio',
    status: 'live',
    notes: 'Catalog hub (gated login + channel)',
  },
  {
    feature: 'Studio Music (archive)',
    tahti: '/dashboard/archive',
    nuclear: '/studio/sounds',
    status: 'live',
    notes: 'List/play/meta/delete + pro editor link',
  },
  {
    feature: 'Studio releases',
    tahti: '/dashboard/releases',
    nuclear: '/studio/releases',
    status: 'live',
    notes: 'List + PATCH smart-link targets',
  },
  {
    feature: 'Studio collections',
    tahti: '/dashboard/collections',
    nuclear: '/studio/collections',
    status: 'live',
    notes: 'Add/reorder/remove items',
  },
  {
    feature: 'Studio upload',
    tahti: '/dashboard/upload',
    nuclear: '/library/upload',
    status: 'live',
    notes: 'prepare → PUT → complete (mock offline)',
  },
  {
    feature: 'Audio editor',
    tahti: '/dashboard/editor + archive editor',
    nuclear: '/studio/editor, /studio/sounds/$id/editor',
    status: 'live',
    notes: 'Waveform cut/trim, EQ/comp/limiter, stems request, draft/render',
  },
  {
    feature: 'AGM / board meetings',
    tahti: '/admin/agm',
    nuclear: '/admin/agm',
    status: 'admin',
    notes:
      'Board-only: persisted meeting agenda/notice/schedule, live attendance + quorum, and a linked/publishable document archive (added 2026-09-01)',
  },
  {
    feature: 'Help',
    tahti: '/help/*',
    nuclear: '/help, /help/$slug',
    status: 'live',
    notes: 'Static hub + articles',
  },
  {
    feature: 'Join / Login',
    tahti: '/join, /login',
    nuclear: '/join, /login',
    status: 'live',
    notes: 'Session + TOTP',
  },
  {
    feature: 'Embeds',
    tahti: '/embed/c, /embed/r, /embed/col',
    nuclear: '/embed/c, /embed/r, /embed/col, /embed/u/…/c/…',
    status: 'live',
    notes: 'Minimal Nuclear chrome',
  },
  {
    feature: 'Seek (VOD)',
    tahti: 'apps/web player',
    nuclear: 'PlayerBar.SeekBar',
    status: 'live',
    notes: 'Archive/VOD only',
  },
  {
    feature: 'Press kit / gallery',
    tahti: '/dashboard press kit',
    nuclear: '/settings/artist?tab=branding',
    status: 'live',
    notes: 'Bio, links, members, media, gallery, and press-kit metadata',
  },
  {
    feature: 'Board admin',
    tahti: '/admin/*',
    nuclear: '/admin/*',
    status: 'partial',
    notes:
      '22 top-level views are present; detail flows, bulk file tools, payout retry, legacy migration, and grant execution remain scoped down',
  },
  {
    feature: 'Public venue detail',
    tahti: '/v/:slug',
    nuclear: '—',
    status: 'missing',
    notes: 'Directory and registration exist; individual venue profiles do not',
  },
  {
    feature: 'Transparency methodology',
    tahti: '/transparency/methodology',
    nuclear: '—',
    status: 'missing',
    notes:
      'The main transparency dashboard exists; its methodology page does not',
  },
  {
    feature: 'Public feature requests',
    tahti: '/governance/feature-requests',
    nuclear: '/governance/feature-requests',
    status: 'live',
    notes: 'Member topic board with voting and discussion',
  },
  {
    feature: 'Upload job detail',
    tahti: '/dashboard/upload/:uploadId',
    nuclear: '—',
    status: 'missing',
    notes:
      'Upload works, but there is no durable processing/progress detail route',
  },
  {
    feature: 'Support request form',
    tahti: '/help/support',
    nuclear: '/help/support',
    status: 'partial',
    notes:
      'Help content exists; authenticated ticket submission still links out',
  },
  {
    feature: 'Tahti Jam',
    tahti: '—',
    nuclear: '/jam/$code',
    status: 'live',
    notes:
      'Host-authoritative synced group listening from a playlist. Backend SSE fan-out is Redis pub/sub (survives multiple API instances); guest playback actually streams in sync, not just a status readout.',
  },
  {
    feature: 'Artwork presets',
    tahti: '—',
    nuclear: '/admin/artwork-presets',
    status: 'admin',
    notes:
      'The 16 built-in placeholder covers for artwork-free uploads — protected defaults, per-slot assignable custom-upload pool, saved per admin, reset-to-defaults.',
  },
];

export function statusClass(status: Status): string {
  switch (status) {
    case 'live':
      return 'bg-primary text-primary-foreground';
    case 'stub':
      return 'border-border text-foreground-secondary border';
    case 'partial':
      return 'bg-accent-yellow/20 text-foreground';
    case 'missing':
      return 'bg-accent-red/15 text-accent-red';
    case 'studio':
    case 'admin':
      return 'bg-background-secondary text-foreground-secondary';
    default:
      return '';
  }
}
