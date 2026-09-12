import { Badge, Button, ViewShell } from '@tahti-player/ui';

import { FlowGallery } from '../components/FlowGallery';
import { MapCommentForm } from '../components/MapCommentForm';
import { PortInventoryPanel } from '../components/PortInventoryPanel';
import { ParityBadges, ScreenAtlas } from '../components/ScreenAtlas';
import { StudioPanel } from '../components/StudioPanel';
import type { MapParity } from '../content/mapScreens';
import { useMapNotesStore } from '../stores/mapNotesStore';

/** `storybook dev -p 6006` — see packages/storybook/package.json. Not
 * deployed anywhere; this only resolves when someone has it running
 * locally alongside this app. */
const STORYBOOK_URL = 'http://localhost:6006';

type Status = 'live' | 'partial' | 'missing' | 'stub' | 'studio' | 'admin';

type FeatureRow = {
  feature: string;
  tahti: string;
  nuclear: string;
  status: Status;
  notes?: string;
};

function isAbsentSurface(value: string): boolean {
  const v = value.trim();
  return v === '' || v === '—' || v === '-';
}

function featureParity(row: FeatureRow): MapParity {
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

const STATUS_LABEL: Record<Status, string> = {
  live: 'Live in POC',
  partial: 'Partial parity',
  missing: 'Missing in POC',
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
    nuclear: '/settings/artist?tab=channel-designer',
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

function statusClass(status: Status): string {
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

function FeatureCompareCard({ row }: { row: FeatureRow }) {
  const parity = featureParity(row);
  const tahtiAbsent = isAbsentSurface(row.tahti);
  const nuclearAbsent = isAbsentSurface(row.nuclear);

  return (
    <article
      className={`border-border bg-background-secondary/40 overflow-hidden rounded-xl border ${
        parity !== 'both' ? 'ring-accent-yellow/40 ring-1 ring-offset-0' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 p-3 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-semibold">{row.feature}</h3>
          <span
            className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
          >
            {STATUS_LABEL[row.status]}
          </span>
        </div>
        <ParityBadges parity={parity} />
      </div>
      <div className="border-border grid border-t sm:grid-cols-2">
        <div
          className={`border-border flex min-w-0 flex-col gap-1 border-b p-3 sm:border-r sm:border-b-0 ${
            tahtiAbsent ? 'bg-background-secondary/80' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              Tahti
              <span className="text-foreground-secondary ml-1 font-normal normal-case">
                app.tahti.live
              </span>
            </span>
            {tahtiAbsent ? (
              <Badge variant="pill" color="cyan">
                beta.tahti.live only
              </Badge>
            ) : null}
          </div>
          <p
            className={`font-mono text-xs break-all ${
              tahtiAbsent
                ? 'text-foreground-secondary italic'
                : 'text-foreground-secondary'
            }`}
          >
            {tahtiAbsent ? 'No equivalent' : row.tahti}
          </p>
        </div>
        <div
          className={`flex min-w-0 flex-col gap-1 p-3 ${
            nuclearAbsent ? 'bg-background-secondary/80' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              beta.tahti.live
              <span className="text-foreground-secondary ml-1 font-normal normal-case">
                beta.tahti.live
              </span>
            </span>
            {nuclearAbsent ? (
              <Badge variant="pill" color="orange">
                Tahti only
              </Badge>
            ) : null}
          </div>
          <p
            className={`font-mono text-xs break-all ${
              nuclearAbsent
                ? 'text-foreground-secondary italic'
                : 'text-foreground'
            }`}
          >
            {nuclearAbsent ? 'No equivalent' : row.nuclear}
          </p>
        </div>
      </div>
      {row.notes ? (
        <p className="text-foreground-secondary border-border border-t px-3 py-2 text-xs">
          {row.notes}
        </p>
      ) : null}
      <MapCommentForm
        kind="feature"
        targetId={row.feature}
        title={row.feature}
        feature={row.feature}
        label="Parity comment"
        placeholder={`Comment on “${row.feature}”…`}
        className="border-border flex flex-col gap-2 border-t px-3 py-3"
      />
    </article>
  );
}

function SavedMapComments() {
  const comments = useMapNotesStore((s) => s.comments);
  const clearComments = useMapNotesStore((s) => s.clearComments);

  if (comments.length === 0) {
    return null;
  }

  return (
    <section
      id="saved-comments"
      className="border-border flex flex-col gap-3 rounded-xl border p-4"
      aria-labelledby="saved-comments-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="saved-comments-heading"
            className="font-display text-xl font-bold tracking-tight"
          >
            Saved comments
          </h2>
          <p className="text-foreground-secondary mt-1 text-sm">
            Submitted from this page · stored in localStorage (
            <code className="text-foreground">tahti-web-map-notes</code>).
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => clearComments()}>
          Clear log
        </Button>
      </div>
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {comments.map((c) => (
          <li
            key={c.id}
            className="border-border bg-background-secondary/40 rounded-lg border px-3 py-2 text-sm"
          >
            <div className="text-foreground-secondary flex flex-wrap gap-x-2 text-[11px] tracking-wide uppercase">
              <span>{c.kind}</span>
              <span>{c.title}</span>
              {c.pack ? <span>pack {c.pack}</span> : null}
              <span>{new Date(c.submittedAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{c.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MoreView() {
  const gapCount = FEATURES.filter((r) => featureParity(r) !== 'both').length;

  return (
    <ViewShell
      title="Tahti map"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-7xl',
        scrollableArea: 'gap-8',
      }}
    >
      <nav className="flex flex-wrap gap-2 text-xs">
        <a
          href="#cases-anonymous"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Anonymous
        </a>
        <a
          href="#cases-auth"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Auth
        </a>
        <a
          href="#cases-listener"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Listener
        </a>
        <a
          href="#cases-artist"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Artist
        </a>
        <a
          href="#cases-edge"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Edge
        </a>
        <a
          href="#flow-gallery"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Flows
        </a>
        <a
          href="#design-system"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Design
        </a>
        <a
          href="#feature-matrix"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Features
        </a>
        <a
          href="#saved-comments"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Comments
        </a>
      </nav>

      <ScreenAtlas />

      <FlowGallery />

      <PortInventoryPanel />

      <section id="design-system" className="scroll-mt-4">
        <StudioPanel
          title="Design system"
          action={
            <a href={STORYBOOK_URL} target="_blank" rel="noreferrer">
              <Button size="sm">Open Storybook →</Button>
            </a>
          }
        >
          <p className="text-foreground-secondary text-sm">
            Every shared tahti-web component and view — panels, dialogs,
            admin/studio chrome — is catalogued in Storybook alongside the
            existing <code className="text-foreground">@tahti-player/ui</code>{' '}
            library. New or changed UI should match what's documented there; see{' '}
            <code className="text-foreground">UI-REDESIGN-WORKLOG.md</code>
            's compliance-sweep entries for known gaps still being worked
            through.
          </p>
          <p className="text-foreground-secondary mt-2 text-xs">
            Not running locally? Start it with{' '}
            <code className="text-foreground">pnpm storybook</code> (port 6006).
          </p>
        </StudioPanel>
      </section>

      <SavedMapComments />

      <section
        id="feature-matrix"
        className="flex flex-col gap-3"
        aria-labelledby="feature-matrix-heading"
      >
        <div>
          <h2
            id="feature-matrix-heading"
            className="font-display text-2xl font-extrabold tracking-tight"
          >
            Feature matrix
          </h2>
          <p className="text-foreground-secondary mt-1 max-w-3xl text-sm">
            Same inventory as before — each row is Tahti | beta.tahti.live side
            by side. Rows that exist on only one surface show a parity-gap
            badge.
          </p>
          <p className="text-foreground-secondary mt-1 text-xs tracking-wide uppercase">
            {FEATURES.length} features · {gapCount} parity gap
            {gapCount === 1 ? '' : 's'}
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {FEATURES.map((row) => (
            <li key={row.feature}>
              <FeatureCompareCard row={row} />
            </li>
          ))}
        </ul>
      </section>

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
    </ViewShell>
  );
}
