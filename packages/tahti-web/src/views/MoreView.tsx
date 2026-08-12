import { Link } from '@tanstack/react-router';

import { FlowGallery } from '../components/FlowGallery';
import { ScreenAtlas } from '../components/ScreenAtlas';

type Status = 'live' | 'stub' | 'studio' | 'admin';

type FeatureRow = {
  feature: string;
  tahti: string;
  nuclear: string;
  status: Status;
  notes?: string;
};

const STATUS_LABEL: Record<Status, string> = {
  live: 'Live in POC',
  stub: 'Stub / deep-link',
  studio: 'Studio-only (out of scope)',
  admin: 'Admin-only (out of scope)',
};

const FEATURES: FeatureRow[] = [
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
    notes: 'Channel HLS + /api/v1/radio relay + recently-played',
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
    nuclear: '/sources, /sources/$id',
    status: 'live',
    notes: 'CardGrid service tiles + status chips; click → detail',
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
    notes: '@nuclearplayer/themes presets under Settings',
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
    nuclear: '/chat, rail + channel tab',
    status: 'live',
    notes: 'Centrifugo + captcha; no prod mock-join; access gating',
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
    notes: 'summary + top tracks/countries; ledger via /studio/revenue lite',
  },
  {
    feature: 'Studio channel settings',
    tahti: '/dashboard/settings/* + channel/edit',
    nuclear: '/studio/channel (+ profile Design tab)',
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
    nuclear: '/library/messages',
    status: 'live',
    notes: 'Inbox + thread',
  },
  {
    feature: 'Revenue lite',
    tahti: 'fan-subs connect + grants',
    nuclear: '/studio/revenue',
    status: 'live',
    notes: 'Connect status + grant estimate/history',
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
    nuclear: '/status',
    status: 'live',
    notes: 'GET /api/v1/status',
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
    nuclear: '/studio/archive',
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
    nuclear: '/studio/upload',
    status: 'live',
    notes: 'prepare → PUT → complete (mock offline)',
  },
  {
    feature: 'Audio editor',
    tahti: '/dashboard/editor + archive editor',
    nuclear: '/studio/editor, /studio/archive/$id/editor',
    status: 'live',
    notes: 'Waveform cut/trim, EQ/comp/limiter, stems request, draft/render',
  },
  {
    feature: 'Governance vote/comment',
    tahti: '/governance',
    nuclear: '/governance',
    status: 'live',
    notes: 'YES/NO/ABSTAIN + discussion; mock mutates tally',
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
    feature: 'Press kit / gallery extras',
    tahti: '/dashboard press kit',
    nuclear: '—',
    status: 'studio',
    notes: 'Not rebuilt; use production dashboard',
  },
  {
    feature: 'Board admin',
    tahti: '/admin/*',
    nuclear: '—',
    status: 'admin',
    notes: 'Do not rebuild in Nuclear chrome',
  },
];

function statusClass(status: Status): string {
  switch (status) {
    case 'live':
      return 'bg-primary text-foreground';
    case 'stub':
      return 'border-border text-foreground-secondary border';
    case 'studio':
    case 'admin':
      return 'bg-background-secondary text-foreground-secondary';
    default:
      return '';
  }
}

const QUICK_LINKS: Array<{
  to: string;
  label: string;
  params?: Record<string, string>;
}> = [
  { to: '/studio/go-live', label: 'Go Live' },
  { to: '/sources', label: 'Sources' },
  { to: '/studio/schedule', label: 'Schedule' },
  { to: '/studio/stats', label: 'Stats' },
  { to: '/studio/updates', label: 'Updates' },
  { to: '/studio/revenue', label: 'Revenue' },
  { to: '/library/messages', label: 'Messages' },
  { to: '/settings', label: 'Settings' },
  { to: '/settings/$section', label: 'Themes', params: { section: 'themes' } },
  { to: '/governance', label: 'Governance' },
  { to: '/help', label: 'Help' },
  { to: '/venues', label: 'Venues' },
  { to: '/transparency', label: 'Transparency' },
  { to: '/status', label: 'Status' },
  { to: '/chat', label: 'Chat' },
];

export function MoreView() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Tahti map
        </h1>
        <p className="text-foreground-secondary mt-1 max-w-2xl text-sm">
          Nuclear listen / studio surfaces aligned with the mermaid user flows.
          Screen atlas = flow step | live beta screenshot. Flow gallery below
          for diagrams. Checklist:{' '}
          <code className="text-foreground">FEATURES.md</code>.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={`${link.to}-${link.label}`}
            to={link.to}
            params={link.params}
            className="border-border text-foreground-secondary hover:text-foreground rounded-md border px-3 py-1.5 text-xs font-medium tracking-wide uppercase"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <ScreenAtlas />

      <FlowGallery />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
              <th className="py-2 pr-3 font-medium">Feature</th>
              <th className="py-2 pr-3 font-medium">Tahti</th>
              <th className="py-2 pr-3 font-medium">Nuclear POC</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row) => (
              <tr
                key={row.feature}
                className="border-border border-b align-top"
              >
                <td className="py-3 pr-3 font-medium">{row.feature}</td>
                <td className="text-foreground-secondary py-3 pr-3 font-mono text-xs">
                  {row.tahti}
                </td>
                <td className="py-3 pr-3 font-mono text-xs">{row.nuclear}</td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="text-foreground-secondary py-3 text-xs">
                  {row.notes ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-foreground-secondary text-xs">
        Production site:{' '}
        <a
          href="https://tahti.live"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          tahti.live
        </a>
      </p>
    </div>
  );
}
