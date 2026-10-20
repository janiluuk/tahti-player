export type ReleaseNoteSectionId =
  | 'listen'
  | 'studio'
  | 'library'
  | 'admin'
  | 'settings'
  | 'desktop'
  | 'platform';

export type ReleaseNoteSection = {
  id: ReleaseNoteSectionId;
  label: string;
  highlights: string[];
};

export type ReleaseNote = {
  /** Stable key, usually the cycle end date. */
  id: string;
  /** Biweekly period shown in the timeline, e.g. "7–20 Oct 2026". */
  period: string;
  /** ISO date for sorting / display (end of the cycle). */
  date: string;
  /** Web package version around the end of the cycle, when known. */
  version?: string;
  sections: ReleaseNoteSection[];
};

export function countHighlights(note: ReleaseNote): number {
  return note.sections.reduce(
    (sum, section) => sum + section.highlights.length,
    0,
  );
}

/** Plain-language, user-facing release notes in ~two-week cycles.
 * Grouped by product section. Translated from shipped PRs / worklog into
 * what an artist or listener would notice — not every internal bump. */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: '2026-10-20',
    period: '7–20 Oct 2026',
    date: '2026-10-20',
    version: '0.0.230',
    sections: [
      {
        id: 'listen',
        label: 'Listen',
        highlights: [
          'Space plays and pauses the current track; Enter in search opens a full results page.',
          'The front page leads with Tahti Selects, new releases, this week’s trending, Coming up shows, and the latest Tahti news — plus a clearer intro for signed-out visitors.',
          'Live now and Replays are separate on Listen home; Spotify Listen widgets show real playlist tracks.',
          'Spotify, Mixcloud, Bandcamp and hearthis embeds play like native tracks in tables, Favorites, History and the player bar.',
          'Open the full-screen player from the queue; Ambient track rows on Library Sounds have a size control.',
          'Full-screen player includes radio programme; long bios and descriptions get Show more.',
        ],
      },
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Studio home shows recent uploads and this month’s fan-sub income.',
          'Published releases can register with MusicBrainz and remember the choice; tracks show a Processing animation while they finish.',
          'Upload progress for SoundCloud and Drive imports; add several selected sounds to a playlist or release at once.',
          'Distribution sits in the Studio nav; Chat is reachable from More.',
          'Studio Pro multitrack: stems, automation, morph, MIDI piano roll and bounce upload.',
          'Channel visualizer show packs; choose public playlist track order; off-air channels say when no shows are booked.',
        ],
      },
      {
        id: 'library',
        label: 'Library',
        highlights: [
          'Smart playlists with richer rules, live counts, and typed editors (desktop library sync).',
          'Listener Stash shows files without requiring Studio; listeners’ Library hides artist-only tools.',
        ],
      },
      {
        id: 'admin',
        label: 'Admin & governance',
        highlights: [
          'Monitoring hub embeds Grafana vital services and live container logs, with shortcuts from the admin dashboard.',
          'Members can second motion drafts; proposers can edit or withdraw drafts; comment moderation on motions.',
          'Channel chat moderation with ban list and message actions; Admin → Venues names who submitted each venue.',
        ],
      },
      {
        id: 'desktop',
        label: 'Desktop & CLI',
        highlights: [
          'Desktop update check and install from Settings; Discord and MPD control the player again.',
          'tahti CLI covers likes, feed, messages, mentions, blocks, purchases, collections, releases and library tools.',
          'Maintainer tahti-ops CLI covers env, smoke, backup status and deploy helpers.',
        ],
      },
      {
        id: 'platform',
        label: 'Platform',
        highlights: [
          'Empty lists and failed loads say what went wrong and offer Retry instead of looking blank.',
          'Phone top bar search; every page has its own browser-tab title; Shift+click Play queues a track.',
        ],
      },
    ],
  },
  {
    id: '2026-10-06',
    period: '23 Sep – 6 Oct 2026',
    date: '2026-10-06',
    sections: [
      {
        id: 'listen',
        label: 'Listen',
        highlights: [
          'Discover widgets for Latest releases and Tahti Selects; channel and /channel link previews.',
          'Repost a track from its page; AI-generated tracks are labeled on the track page.',
          'Artists can hide the page hero or keep their name out of the annual grant report.',
        ],
      },
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Import draft releases from CSV; add Mixcloud cloudcasts to a collection.',
          'Newsletter delivery stats per send; artist nameplate and page-hero settings.',
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        highlights: [
          'Account and Artist settings are grouped into clearer tab sections.',
          'Block and unblock people from Settings, messages, or an artist page; membership invoices live under Account.',
          'Mentions link to where they happened; data export explains what is included; API tokens can expire.',
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        highlights: [
          'Support queue highlights tickets that need a reply; content reports can be filtered by what was reported.',
          'Trim system announcement clips; delete a reported comment from the reports queue.',
        ],
      },
      {
        id: 'desktop',
        label: 'Desktop & CLI',
        highlights: [
          'Desktop local library phases: roots, fast search, browse, sortable table and filters.',
          'tahti CLI interactive shell with hearthis discography import.',
        ],
      },
    ],
  },
  {
    id: '2026-09-22',
    period: '9–22 Sep 2026',
    date: '2026-09-22',
    version: '0.0.113',
    sections: [
      {
        id: 'listen',
        label: 'Listen',
        highlights: [
          'Favorites is its own page; artists live under Discover → Artists.',
          'hearthis embeds play in-app; Finnish radio stations appear in Radio Browser.',
          'Mobile compact player and a slimmer bottom nav.',
        ],
      },
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Channel Designer rebuilt: backdrop, player and look panels, layout hints, and live artist-page look control.',
          'Studio → Audience is the home for tiers and Stripe; Studio subtabs sit under the Studio nav.',
          'Stream Manager no longer wipes 24/7 rotation when replacing a playlist.',
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        highlights: [
          'Settings on phones use a list/detail layout with wrapping tabs.',
          'Last.fm and ListenBrainz scrobbling via the registry.',
        ],
      },
      {
        id: 'desktop',
        label: 'Desktop',
        highlights: [
          'Independent desktop player path with pro library, Soulseek and Tahti chrome.',
          'Local library metadata survives reload.',
        ],
      },
      {
        id: 'platform',
        label: 'Platform',
        highlights: [
          'Shared ViewShell headers across Listen, Studio and Admin; TrackContextMenu on track listings.',
          'Player bar queue on the right rail; sticky notification toasts.',
        ],
      },
    ],
  },
  {
    id: '2026-09-03',
    period: 'Up to 3 Sep 2026',
    date: '2026-09-03',
    version: '0.0.23',
    sections: [
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Channel Designer reorganized into clear sections; visualizers have plain names.',
          'Text overlays and clickable link blocks on channel pages, plus shared cover/backdrop upload.',
          'Elements snap to a grid; share a private Stash link before a sound is public.',
        ],
      },
      {
        id: 'platform',
        label: 'Platform',
        highlights: [
          'Help Center uses tabbed categories with related guides.',
          'Admin orphan-pages hub gathers hard-to-find admin surfaces.',
          'Favourites for channels, playlists and artists; “What is Tahti” page and radio station browser.',
          'Governance for cooperative members; smoother artist subscriptions; consistent Studio/Library track listings.',
          'Faster loads and playback fixes; menus behave on tablet screens.',
        ],
      },
    ],
  },
];
