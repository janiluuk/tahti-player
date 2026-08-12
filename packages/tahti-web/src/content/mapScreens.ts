/** Flow-aligned screen atlas for `/more`.
 *
 * Groups match **Planned Nuclear** mermaid packs in `flowDiagrams.ts`.
 * Images under `/map/nuclear/` are viewport captures of https://beta.tahti.live
 * (Playwright + Chromium). Studio routes may show the login gate when unauthenticated.
 */

export type MapFlowStep = {
  id: string;
  /** View name */
  title: string;
  /** Nuclear / beta route */
  route: string;
  /** Short “what this step is” from the mermaid flow */
  flowStep: string;
  /** Feature / journey description (left column) */
  feature: string;
  /** Path under public/map/nuclear/ */
  image: string;
};

export type MapFlowGroup = {
  id: string;
  title: string;
  /** Matching FLOW_DIAGRAMS id (planned pack) */
  flowId: string;
  description: string;
  steps: MapFlowStep[];
};

export const MAP_FLOW_GROUPS: MapFlowGroup[] = [
  {
    id: 'anonymous',
    title: 'Part 1 · Anonymous listen',
    flowId: 'planned-anonymous-listener',
    description:
      'Land on Listen → Radio / Channel / Profile → Queue·Chat rail + player bar.',
    steps: [
      {
        id: 'listen',
        title: 'Listen directory',
        route: '/',
        flowStep: 'Open beta → Listen (Nuclear main)',
        feature:
          'Discovery hub: channel directory, search, genre chips. Entry node of the anonymous listener flow.',
        image: '/map/nuclear/listen.png',
      },
      {
        id: 'radio',
        title: 'Tahti Radio',
        route: '/radio',
        flowStep: 'Listen → /radio',
        feature:
          'Co-op radio now-playing. From here listeners jump into a live channel.',
        image: '/map/nuclear/radio.png',
      },
      {
        id: 'channel',
        title: 'Channel',
        route: '/channel/$slug',
        flowStep: 'Channel → player bar + right rail (Queue | Chat)',
        feature:
          'Live / archive / chat / about. Visualizer on Live; chat opens the same panel as the right rail.',
        image: '/map/nuclear/channel.png',
      },
      {
        id: 'profile',
        title: 'Artist profile',
        route: '/u/$username',
        flowStep: 'Profile → channel / subscribe / collection',
        feature:
          'Public artist page: bio, tracks, collections, path into fan subscribe.',
        image: '/map/nuclear/profile.png',
      },
      {
        id: 'subscribe',
        title: 'Fan subscribe',
        route: '/subscribe/$username',
        flowStep: 'Profile → /subscribe/:username → Stripe',
        feature:
          'Tier cards and checkout entry for fan perks (including fan chat when enabled).',
        image: '/map/nuclear/subscribe.png',
      },
      {
        id: 'more',
        title: 'Tahti map',
        route: '/more',
        flowStep: 'Listen → /more · help · legal',
        feature:
          'This page: flow gallery + annotated Nuclear screen atlas (you are here).',
        image: '/map/nuclear/more.png',
      },
      {
        id: 'help',
        title: 'Help',
        route: '/help',
        flowStep: 'Listen → help / legal surfaces',
        feature: 'Help center index for listeners and artists.',
        image: '/map/nuclear/help.png',
      },
      {
        id: 'transparency',
        title: 'Transparency',
        route: '/transparency',
        flowStep: 'Public trust surfaces',
        feature: 'YTD / grants transparency for the co-op.',
        image: '/map/nuclear/transparency.png',
      },
      {
        id: 'status',
        title: 'Status',
        route: '/status',
        flowStep: 'Public platform health',
        feature: 'Live status of API / streaming dependencies.',
        image: '/map/nuclear/status.png',
      },
    ],
  },
  {
    id: 'member',
    title: 'Part 2 · Auth & member',
    flowId: 'planned-logged-in-listener',
    description:
      'Join · verify · login → Library / subscribe / governance / settings.',
    steps: [
      {
        id: 'join',
        title: 'Join',
        route: '/join',
        flowStep: 'Anonymous → /join · /login · TOTP',
        feature: 'Register a Tahti account (captcha when configured).',
        image: '/map/nuclear/join.png',
      },
      {
        id: 'verify',
        title: 'Verify email',
        route: '/verify',
        flowStep: 'Join → verify email',
        feature: 'Email token landing; auto-verifies when `?token=` is present.',
        image: '/map/nuclear/verify.png',
      },
      {
        id: 'login',
        title: 'Login',
        route: '/login',
        flowStep: 'Auth gate into Listen / Library / Studio',
        feature: 'Session cookie login with optional TOTP second factor.',
        image: '/map/nuclear/login.png',
      },
      {
        id: 'library',
        title: 'Library',
        route: '/library',
        flowStep: 'Listen → /library · Favorites · History · Messages',
        feature:
          'Logged-in listener shelf: favorites, local history, DMs tabs.',
        image: '/map/nuclear/library.png',
      },
      {
        id: 'governance',
        title: 'Governance',
        route: '/governance',
        flowStep: 'Listen → /governance (if member)',
        feature: 'Member motions and votes — requires co-op membership.',
        image: '/map/nuclear/governance.png',
      },
      {
        id: 'settings',
        title: 'Settings',
        route: '/settings',
        flowStep: 'Settings → Account / Themes / Money…',
        feature:
          'Nuclear-style settings shell (account, artist, money/tiers, connections, themes).',
        image: '/map/nuclear/settings.png',
      },
    ],
  },
  {
    id: 'artist',
    title: 'Part 3 · Artist studio',
    flowId: 'planned-artist',
    description:
      'Studio tabs: Go Live, catalog, upload, stash, stats, Sources tiles. Unauthenticated captures show StudioGate.',
    steps: [
      {
        id: 'studio',
        title: 'Studio home',
        route: '/studio',
        flowStep: 'Login → /studio overview',
        feature: 'Artist overview + in-page Studio nav tabs.',
        image: '/map/nuclear/studio.png',
      },
      {
        id: 'go-live',
        title: 'Go Live',
        route: '/studio/go-live',
        flowStep: 'Studio → Go Live · OBS keys · Multistream',
        feature:
          'Broadcast wizard: Connect → Live → Multistream (signal + RTMP).',
        image: '/map/nuclear/go-live.png',
      },
      {
        id: 'archive',
        title: 'Archive / Music',
        route: '/studio/archive',
        flowStep: 'Tabs → Archive',
        feature: 'Catalog list; add-to-playlist and metadata editing.',
        image: '/map/nuclear/archive.png',
      },
      {
        id: 'collections',
        title: 'Collections',
        route: '/studio/collections',
        flowStep: 'Tabs → Collections (album designer)',
        feature: 'Create / style albums and playlists with cover + tracklist.',
        image: '/map/nuclear/collections.png',
      },
      {
        id: 'upload',
        title: 'Upload',
        route: '/studio/upload',
        flowStep: 'Tabs → Upload',
        feature: 'Archive upload: prepare → PUT → complete on live API.',
        image: '/map/nuclear/upload.png',
      },
      {
        id: 'stash',
        title: 'Stash',
        route: '/studio/stash',
        flowStep: 'Tabs → Stash (private locker)',
        feature: 'Private file locker with upload / play / download / delete.',
        image: '/map/nuclear/stash.png',
      },
      {
        id: 'stats',
        title: 'Stats summary',
        route: '/studio/stats',
        flowStep: 'Tabs → Stats',
        feature: 'KPI counters + top tracks / countries.',
        image: '/map/nuclear/stats.png',
      },
      {
        id: 'stats-detail',
        title: 'Stats detail',
        route: '/studio/stats/detail',
        flowStep: 'Stats → plays series detail',
        feature: 'Daily plays chart (7 / 30 / all) + download countries.',
        image: '/map/nuclear/stats-detail.png',
      },
      {
        id: 'sources',
        title: 'Sources',
        route: '/sources',
        flowStep: 'Studio → /sources · big tiles',
        feature:
          'Import hub: Bandcamp, SoundCloud, Drive, Mixcloud, Spotify, stash.',
        image: '/map/nuclear/sources.png',
      },
    ],
  },
];

/** @deprecated use MAP_FLOW_GROUPS — kept for any stray imports */
export const MAP_SCREEN_GROUPS = MAP_FLOW_GROUPS.map((g) => ({
  id: g.id,
  title: g.title,
  description: g.description,
  screens: g.steps.map((s) => ({
    id: s.id,
    title: s.title,
    route: s.route,
    prodRoute: s.route,
    image: s.image,
    blurb: s.flowStep,
  })),
}));
