/** Screenshot atlas + concrete flow cases for the Tahti map (`/more`).
 *
 * Old = production Tahti chrome (`public/map/{listen,studio,auth,settings}/`)
 * New = Nuclear beta (`public/map/nuclear/`). Missing new shots show
 * "Nuclear shot pending" rather than inventing pixels.
 */

export type MapShot = {
  /** Path under /map/… served from public/; omit when pending */
  image?: string;
  /** Route on that surface (prod or POC) */
  route: string;
  /** Short caption under the thumbnail */
  caption: string;
  /**
   * Surface has no equivalent view/route (not merely a pending screenshot).
   * Prefer setting `parity` on the case; this marks the empty pane.
   */
  absent?: boolean;
};

/** Whether both surfaces implement the view, or only one (parity gap). */
export type MapParity = 'both' | 'tahti-only' | 'nuclear-only';

export type MapCase = {
  id: string;
  /** Case title shown on the card */
  title: string;
  /** View / surface name */
  viewName: string;
  /** What situation this case covers */
  caption: string;
  action?: string;
  old: MapShot;
  new: MapShot;
  /** Explicit parity; inferred from shot.absent when omitted */
  parity?: MapParity;
};

/** Resolve whether a case exists on Tahti, Nuclear, or both. */
export function resolveCaseParity(c: MapCase): MapParity {
  if (c.parity) {
    return c.parity;
  }
  const tahtiAbsent = Boolean(c.old.absent);
  const nuclearAbsent = Boolean(c.new.absent);
  if (tahtiAbsent && !nuclearAbsent) {
    return 'nuclear-only';
  }
  if (!tahtiAbsent && nuclearAbsent) {
    return 'tahti-only';
  }
  return 'both';
}

export type MapCaseGroup = {
  id: string;
  title: string;
  description: string;
  cases: MapCase[];
};

/** @deprecated Prefer MAP_CASE_GROUPS — kept for any external imports */
export type MapScreen = {
  id: string;
  title: string;
  route: string;
  prodRoute: string;
  image: string;
  blurb: string;
};

export type MapScreenGroup = {
  id: string;
  title: string;
  description: string;
  screens: MapScreen[];
};

export const MAP_CASE_GROUPS: MapCaseGroup[] = [
  {
    id: 'anonymous',
    title: 'Anonymous listen',
    description:
      'Public discovery and playback without a session — home, live vs archive, chat join, subscribe gates, embeds.',
    cases: [
      {
        id: 'anon-home',
        title: 'Home / listen directory',
        viewName: 'Listen',
        caption: 'Anonymous lands on channel directory (search + genres).',
        old: {
          image: '/map/listen/listen.png',
          route: '/listen',
          caption: 'Prod directory grid',
        },
        new: {
          image: '/map/nuclear/listen.png',
          route: '/',
          caption: 'Nuclear Listen hub',
        },
      },
      {
        id: 'anon-radio-online',
        title: 'Tahti Radio online',
        viewName: 'Radio',
        caption:
          'Co-op radio now-playing when the stream is up (always-on HLS).',
        old: {
          image: '/map/listen/radio.png',
          route: '/radio',
          caption: 'Prod radio page',
        },
        new: {
          image: '/map/nuclear/radio.png',
          route: '/radio',
          caption: 'Nuclear radio + player bar',
        },
      },
      {
        id: 'anon-channel-live',
        title: 'Channel live',
        viewName: 'Channel',
        caption: 'Artist is broadcasting — LIVE badge, HLS live, public chat.',
        old: {
          image: '/map/listen/channel-live.png',
          route: '/c/:slug (live)',
          caption: 'Prod LIVE channel',
        },
        new: {
          image: '/map/nuclear/channel.png',
          route: '/channel/$slug',
          caption: 'Nuclear channel (live or archive)',
        },
      },
      {
        id: 'anon-channel-offline',
        title: 'Channel offline / archive',
        viewName: 'Channel',
        caption: 'Not live — rotation / archive VOD, seekable player.',
        old: {
          image: '/map/listen/channel.png',
          route: '/c/:slug (offline)',
          caption: 'Prod archive / offline',
        },
        new: {
          image: '/map/nuclear/channel.png',
          route: '/channel/$slug',
          caption: 'Same route; archive library tab',
        },
      },
      {
        id: 'anon-chat-join',
        title: 'Chat join (anonymous handle)',
        viewName: 'Channel chat',
        caption:
          'Join public chat with a handle + captcha; no account required.',
        old: {
          image: '/map/listen/channel-live.png',
          route: '/c/:slug chat',
          caption: 'Prod channel chat rail',
        },
        new: {
          image: '/map/nuclear/channel-chat.png',
          route: '/chat/$slug / channel Chat tab',
          caption: 'Nuclear chat rail',
        },
      },
      {
        id: 'anon-profile',
        title: 'Artist profile',
        viewName: 'Profile',
        caption: 'Bio, tracks, collections — entry to subscribe and channel.',
        old: {
          image: '/map/listen/profile.png',
          route: '/u/:username',
          caption: 'Prod profile',
        },
        new: {
          image: '/map/nuclear/profile.png',
          route: '/u/$username',
          caption: 'Nuclear profile tabs',
        },
      },
      {
        id: 'anon-subscribe-gate',
        title: 'Subscribe gate (logged out)',
        viewName: 'Fan subscribe',
        caption:
          'Tier cards visible; checkout pushes join/login before Stripe.',
        old: {
          image: '/map/listen/subscribe.png',
          route: '/u/:user/subscribe',
          caption: 'Prod tier cards',
        },
        new: {
          image: '/map/nuclear/subscribe.png',
          route: '/subscribe/$username',
          caption: 'Nuclear subscribe',
        },
      },
      {
        id: 'anon-smart-link',
        title: 'Smart link release',
        viewName: 'Smart link',
        caption: 'DSP landing for a release slug.',
        old: {
          image: '/map/listen/smart-link.png',
          route: '/r/:slug',
          caption: 'Prod smart link',
        },
        new: {
          image: '/map/nuclear/smart-link.png',
          route: '/r/$slug',
          caption: 'Nuclear smart link',
        },
      },
      {
        id: 'anon-collection',
        title: 'Public collection',
        viewName: 'Collection',
        caption: 'Playlist / album page on the artist profile.',
        old: {
          image: '/map/listen/collection.png',
          route: '/u/:user/c/:slug',
          caption: 'Prod collection',
        },
        new: {
          image: '/map/nuclear/collection.png',
          route: '/u/$username/c/$slug',
          caption: 'Nuclear collection',
        },
      },
      {
        id: 'anon-embed',
        title: 'Embed player',
        viewName: 'Embed',
        caption: 'Minimal iframe chrome for channel / release embeds.',
        old: {
          image: '/map/listen/embed.png',
          route: '/embed/c/:slug',
          caption: 'Prod embed',
        },
        new: {
          image: '/map/nuclear/embed.png',
          route: '/embed/c/$slug',
          caption: 'Nuclear embed',
        },
      },
      {
        id: 'anon-venues',
        title: 'Venues calendar',
        viewName: 'Venues',
        caption: 'Public venue list (register is a separate flow).',
        old: {
          image: '/map/listen/venues.png',
          route: '/venues',
          caption: 'Prod venues',
        },
        new: {
          image: '/map/nuclear/venues.png',
          route: '/venues',
          caption: 'Nuclear venues',
        },
      },
      {
        id: 'anon-transparency-status',
        title: 'Transparency + status',
        viewName: 'Trust pages',
        caption: 'YTD / grants transparency and platform health.',
        old: {
          image: '/map/listen/transparency.png',
          route: '/transparency, /status',
          caption: 'Prod transparency',
        },
        new: {
          image: '/map/nuclear/transparency.png',
          route: '/transparency, /status',
          caption: 'Nuclear transparency (status shot separate)',
        },
      },
      {
        id: 'anon-help',
        title: 'Help center',
        viewName: 'Help',
        caption: 'Help index and articles.',
        old: {
          image: '/map/listen/help.png',
          route: '/help',
          caption: 'Prod help',
        },
        new: {
          image: '/map/nuclear/help.png',
          route: '/help',
          caption: 'Nuclear help hub',
        },
      },
    ],
  },
  {
    id: 'auth',
    title: 'Auth',
    description:
      'Account entry: join, email verify, login, optional TOTP step.',
    cases: [
      {
        id: 'auth-join',
        title: 'Join / register',
        viewName: 'Join',
        caption:
          'You can create an artist account with your email, artist name, username, and a confirmed password.',
        old: {
          image: '/map/auth/join.png',
          route: '/join',
          caption: 'Prod join',
        },
        new: {
          image: '/map/nuclear/join.png',
          route: '/join',
          caption: 'Nuclear join',
        },
      },
      {
        id: 'auth-verify',
        title: 'Verify email token',
        viewName: 'Verify',
        caption: 'Landing from email magic/token link.',
        old: {
          image: '/map/auth/verify.png',
          route: '/verify',
          caption: 'Prod verify',
        },
        new: {
          image: '/map/nuclear/verify.png',
          route: '/verify',
          caption: 'Nuclear verify',
        },
      },
      {
        id: 'auth-login',
        title: 'Login',
        viewName: 'Login',
        caption: 'Session cookie via /tahti-api (host-only on beta).',
        old: {
          image: '/map/auth/login.png',
          route: '/login',
          caption: 'Prod login',
        },
        new: {
          image: '/map/nuclear/login.png',
          route: '/login',
          caption: 'Nuclear login',
        },
      },
      {
        id: 'auth-totp',
        title: 'Login + TOTP',
        viewName: 'Login (2FA)',
        caption: 'When TOTP enabled, second factor after password.',
        old: {
          image: '/map/auth/login.png',
          route: '/login (TOTP step)',
          caption: 'Same form; TOTP field when required',
        },
        new: {
          image: '/map/nuclear/login-totp.png',
          route: '/login (TOTP step)',
          caption:
            'Nuclear TOTP step — lives in the AuthDialog modal (opened by /login), not a full-page route.',
        },
      },
    ],
  },
  {
    id: 'listener',
    title: 'Listener / member',
    description:
      'Logged-in listener: library, fan subscribe checkout, DMs, governance vote vs forbidden.',
    cases: [
      {
        id: 'listener-library',
        title: 'Library / follows',
        viewName: 'Library',
        caption: 'Favorites, history, follows after login.',
        old: {
          image: '/map/auth/listener-dashboard.png',
          route: '/dashboard (free listener)',
          caption: 'Prod free listener dashboard',
        },
        new: {
          image: '/map/nuclear/library.png',
          route: '/library',
          caption:
            'You can search every owned sound, filter by visibility or processing state, play it, edit metadata, or open the audio editor.',
        },
      },
      {
        id: 'listener-subscribe-checkout',
        title: 'Fan subscribe checkout',
        viewName: 'Subscribe',
        caption: 'Logged-in fan picks a tier → Stripe checkout URL.',
        old: {
          image: '/map/listen/subscribe.png',
          route: '/u/:user/subscribe',
          caption: 'Prod tiers → Stripe',
        },
        new: {
          image: '/map/nuclear/subscribe.png',
          route: '/subscribe/$username',
          caption: 'Nuclear checkout handoff',
        },
      },
      {
        id: 'listener-dms',
        title: 'DMs / messages',
        viewName: 'Messages',
        caption: 'Inbox + thread for artist ↔ fan messages.',
        old: {
          image: '/map/auth/listener-dashboard.png',
          route: '/dashboard/messages',
          caption: 'Prod messages (via dashboard)',
        },
        new: {
          image: '/map/nuclear/listener-dashboard.png',
          route: '/messages',
          caption: 'Nuclear DMs (in My Library, not a separate dashboard)',
        },
      },
      {
        id: 'listener-gov-member',
        title: 'Governance vote (member)',
        viewName: 'Governance',
        caption: '€40 member can browse motions and cast YES/NO/ABSTAIN.',
        old: {
          image: '/map/auth/governance-member.png',
          route: '/governance',
          caption: 'Prod member governance',
        },
        new: {
          image: '/map/nuclear/governance.png',
          route: '/governance',
          caption: 'Nuclear motions list',
        },
      },
      {
        id: 'listener-gov-forbidden',
        title: 'Governance forbidden (non-member)',
        viewName: 'Governance',
        caption: 'Logged-in free listener is gated — no vote UI.',
        old: {
          image: '/map/auth/governance.png',
          route: '/governance (gated)',
          caption: 'Prod gate / upsell',
        },
        new: {
          image: '/map/nuclear/governance.png',
          route: '/governance (gated)',
          caption: 'Nuclear gated state (same route)',
        },
      },
      {
        id: 'listener-member-home',
        title: 'Member dashboard',
        viewName: 'Member home',
        caption:
          'Member overview after login (prod dashboard vs Nuclear listen).',
        old: {
          image: '/map/auth/member-dashboard.png',
          route: '/dashboard',
          caption: 'Prod member dashboard',
        },
        new: {
          image: '/map/nuclear/listen.png',
          route: '/',
          caption: 'Nuclear defaults to Listen shell',
        },
      },
    ],
  },
  {
    id: 'artist',
    title: 'Artist studio',
    description:
      'Channel owner tools: home, go-live, upload, stash, collections, stats, sources, revenue, design.',
    cases: [
      {
        id: 'artist-home',
        title: 'Studio home',
        viewName: 'Studio',
        caption:
          'You can review clickable audience totals, start or schedule a broadcast, and open every catalog and channel tool.',
        old: {
          image: '/map/studio/home.png',
          route: '/dashboard',
          caption: 'Prod dashboard',
        },
        new: {
          image: '/map/nuclear/studio.png',
          route: '/studio',
          caption: 'Nuclear studio hub',
        },
      },
      {
        id: 'artist-setup-channel',
        title: 'Channel setup and design',
        viewName: 'Channel',
        caption:
          'Create a channel, then continue directly into its profile, visual design, radio, and domain settings.',
        old: {
          image: '/map/studio/setup-channel.png',
          route: '/dashboard/setup-channel',
          caption: 'Prod setup wizard',
        },
        new: {
          image: '/map/nuclear/setup-channel-gated.png',
          route: '/studio/channel?tab=setup',
          caption: 'Nuclear combines channel setup and design',
        },
      },
      {
        id: 'artist-go-live',
        title: 'Go Live wizard',
        viewName: 'Go Live',
        caption: 'OBS/Icecast keys → signal check → go live → multistream.',
        old: {
          image: '/map/studio/go-live-wizard.png',
          route: '/dashboard/broadcast',
          caption: 'Prod broadcast studio',
        },
        new: {
          image: '/map/nuclear/go-live.png',
          route: '/studio/go-live',
          caption:
            'You can monitor the signal, go live, record the broadcast, copy encoder credentials, and manage multistream destinations.',
        },
      },
      {
        id: 'artist-upload',
        title: 'Upload',
        viewName: 'Upload',
        caption: 'prepare → PUT → complete (mock offline supported).',
        old: {
          image: '/map/studio/upload.png',
          route: '/dashboard/upload',
          caption: 'Prod upload',
        },
        new: {
          image: '/map/nuclear/upload.png',
          route: '/studio/upload',
          caption: 'Nuclear upload',
        },
      },
      {
        id: 'artist-archive',
        title: 'Music / archive',
        viewName: 'Archive',
        caption: 'Catalog list — play, meta, delete, open editor.',
        old: {
          image: '/map/studio/archive.png',
          route: '/dashboard/archive',
          caption: 'Prod music archive',
        },
        new: {
          image: '/map/nuclear/archive.png',
          route: '/studio/archive',
          caption: 'Nuclear archive',
        },
      },
      {
        id: 'artist-stash',
        title: 'Stash',
        viewName: 'Stash',
        caption: 'Private locker — not public on channel.',
        old: {
          image: '/map/studio/stash.png',
          route: '/dashboard/stash',
          caption: 'Prod stash',
        },
        new: {
          image: '/map/nuclear/stash.png',
          route: '/studio/stash',
          caption: 'Nuclear stash',
        },
      },
      {
        id: 'artist-collections',
        title: 'Collections / album designer',
        viewName: 'Collections',
        caption: 'Create playlist/album, add/reorder/remove tracks.',
        old: {
          image: '/map/studio/collections.png',
          route: '/dashboard/collections',
          caption: 'Prod collections',
        },
        new: {
          image: '/map/nuclear/collections.png',
          route: '/studio/collections',
          caption: 'Nuclear collections',
        },
      },
      {
        id: 'artist-releases',
        title: 'Releases / smart links',
        viewName: 'Releases',
        caption: 'Smart-link catalog + DSP targets.',
        old: {
          image: '/map/studio/releases.png',
          route: '/dashboard/releases',
          caption: 'Prod releases',
        },
        new: {
          image: '/map/nuclear/releases.png',
          route: '/studio/releases',
          caption: 'Nuclear releases',
        },
      },
      {
        id: 'artist-stats',
        title: 'Stats overview',
        viewName: 'Stats',
        caption: 'Plays, top tracks, countries summary.',
        old: {
          image: '/map/studio/stats.png',
          route: '/dashboard/stats',
          caption: 'Prod stats',
        },
        new: {
          image: '/map/nuclear/stats.png',
          route: '/studio/stats',
          caption:
            'You can compare audience and broadcast metrics, explore listener countries on a world map, and open per-track insights.',
        },
      },
      {
        id: 'artist-stats-detail',
        title: 'Track insights',
        viewName: 'Track insights',
        caption: 'Drill-down for a track and period.',
        old: {
          image: '/map/studio/stats-detail.png',
          route: '/dashboard/stats (detail)',
          caption: 'Prod stats detail',
        },
        new: {
          image: '/map/nuclear/stats-detail.png',
          route: '/studio/insights/archive/:id',
          caption:
            'You can compare a track’s plays and downloads over time and see its audience on the listener world map.',
        },
      },
      {
        id: 'artist-sources',
        title: 'Sources OAuth / import',
        viewName: 'Sources',
        caption: 'Bandcamp, SoundCloud, Drive, Mixcloud, URL tiles.',
        old: {
          image: '/map/settings/connections.png',
          route: '/dashboard/settings/connections',
          caption: 'Prod connections / sources',
        },
        new: {
          image: '/map/nuclear/sources.png',
          route: '/sources',
          caption: 'Nuclear sources tiles',
        },
      },
      {
        id: 'artist-revenue',
        title: 'Revenue / Connect',
        viewName: 'Revenue',
        caption: 'Stripe Connect status + grant estimate/history.',
        old: {
          image: '/map/studio/revenue.png',
          route: '/dashboard/revenue',
          caption: 'Prod revenue',
        },
        new: {
          image: '/map/nuclear/revenue.png',
          route: '/studio/revenue',
          caption: 'Nuclear revenue',
        },
      },
      {
        id: 'artist-channel-design',
        title: 'Channel design',
        viewName: 'Channel design',
        caption: 'Look, presets, accent — also owner Design tab on profile.',
        old: {
          image: '/map/studio/channel.png',
          route: '/dashboard/channel/edit',
          caption: 'Prod channel appearance',
        },
        new: {
          image: '/map/nuclear/channel-design.png',
          route: '/studio/channel',
          caption: 'Nuclear channel designer',
        },
      },
      {
        id: 'artist-schedule',
        title: 'Schedule / programme',
        viewName: 'Schedule',
        caption: 'Next show + programme / fallback toggles.',
        old: {
          image: '/map/studio/schedule.png',
          route: '/dashboard/schedule',
          caption: 'Prod schedule',
        },
        new: {
          image: '/map/nuclear/schedule.png',
          route: '/studio/schedule',
          caption: 'Nuclear schedule',
        },
      },
      {
        id: 'artist-updates',
        title: 'Updates / newsletter',
        viewName: 'Updates',
        caption: 'Posts + compose/send newsletter.',
        old: {
          image: '/map/studio/updates.png',
          route: '/dashboard/newsletter',
          caption: 'Prod newsletter',
        },
        new: {
          image: '/map/nuclear/updates.png',
          route: '/studio/updates',
          caption: 'Nuclear updates',
        },
      },
      {
        id: 'artist-editor',
        title: 'Audio editor',
        viewName: 'Editor',
        caption: 'Waveform cut/trim, EQ, stems, draft/render.',
        old: {
          image: '/map/studio/editor.png',
          route: '/dashboard/editor',
          caption: 'Prod editor',
        },
        new: {
          image: '/map/nuclear/editor.png',
          route: '/studio/editor',
          caption: 'Nuclear editor',
        },
      },
      {
        id: 'artist-settings',
        title: 'Settings (account / artist / money)',
        viewName: 'Settings',
        caption: 'Account, artist info, fan tiers, connections.',
        old: {
          image: '/map/settings/account.png',
          route: '/dashboard/settings/*',
          caption: 'Prod settings account',
        },
        new: {
          image: '/map/nuclear/settings.png',
          route: '/settings/$section',
          caption: 'Nuclear settings sections',
        },
      },
      {
        id: 'artist-money-tiers',
        title: 'Fan tiers / money',
        viewName: 'Money',
        caption: 'Configure fan subscription tiers + Connect.',
        old: {
          image: '/map/settings/money-tiers.png',
          route: '/dashboard/settings/fan-subs',
          caption: 'Prod fan-subs settings',
        },
        new: {
          image: '/map/nuclear/money-tiers.png',
          route: '/settings/money',
          caption: 'Nuclear fan tiers',
        },
      },
      {
        id: 'artist-money-fan-subs',
        title: 'Fan subscription performance',
        viewName: 'Fan subscriptions',
        caption:
          'You can review active subscribers, monthly and yearly net revenue, payout health and transfer history, then export the subscriber list.',
        old: {
          image: '/map/settings/money.png',
          route: '/dashboard/settings/fan-subs',
          caption: 'Prod fan subscription performance',
        },
        new: {
          image: '/map/nuclear/money-fan-subs.png',
          route: '/settings/money',
          caption: 'Nuclear fan subscription performance',
        },
      },
    ],
  },
  {
    id: 'edge',
    title: 'Edge / gate cases',
    description:
      'Payments not ready, studio without login, radio offline badge vs always-on HLS.',
    cases: [
      {
        id: 'edge-payments-not-ready',
        title: 'Payments not ready',
        viewName: 'Revenue / subscribe',
        caption:
          'Connect incomplete or Stripe not configured — checkout / payouts blocked.',
        old: {
          image: '/map/studio/revenue.png',
          route: '/dashboard/revenue',
          caption: 'Prod Connect incomplete state',
        },
        new: {
          image: '/map/nuclear/revenue.png',
          route: '/studio/revenue',
          caption: 'Nuclear revenue',
        },
      },
      {
        id: 'edge-studio-logged-out',
        title: 'Studio while not logged in',
        viewName: 'Studio gate',
        caption: 'Visiting /studio without session → login / join prompt.',
        old: {
          image: '/map/auth/login.png',
          route: '/dashboard → /login',
          caption: 'Prod redirects to login',
        },
        new: {
          image: '/map/nuclear/login.png',
          route: '/studio → /login',
          caption: 'Nuclear gate → login',
        },
      },
      {
        id: 'edge-radio-offline',
        title: 'Radio offline badge vs always-on HLS',
        viewName: 'Radio',
        caption:
          'Prod may show offline badge when Icecast is down; Nuclear aims for always-on HLS when feed exists.',
        old: {
          image: '/map/listen/radio.png',
          route: '/radio',
          caption: 'Prod radio (offline badge when down)',
        },
        new: {
          image: '/map/nuclear/radio.png',
          route: '/radio',
          caption: 'Nuclear radio + player bar HLS',
        },
      },
      {
        id: 'edge-map-itself',
        title: 'This map page',
        viewName: 'More / map',
        caption: 'POC-only atlas for comparing Tahti vs Nuclear flows.',
        parity: 'nuclear-only',
        old: {
          route: '(prod has no /more atlas)',
          caption: 'No prod equivalent',
          absent: true,
        },
        new: {
          image: '/map/nuclear/more.png',
          route: '/more',
          caption: 'Nuclear Tahti map',
        },
      },
    ],
  },
];

/** Flat list for counts / deep links */
export const MAP_CASES: MapCase[] = MAP_CASE_GROUPS.flatMap((g) => g.cases);

/** Legacy single-column groups derived from cases (first image wins). */
export const MAP_SCREEN_GROUPS: MapScreenGroup[] = MAP_CASE_GROUPS.map(
  (group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    screens: group.cases.map((c) => ({
      id: c.id,
      title: c.title,
      route: c.new.route,
      prodRoute: c.old.route,
      image: c.old.image ?? c.new.image ?? '/map/listen/listen.png',
      blurb: c.caption,
    })),
  }),
);
