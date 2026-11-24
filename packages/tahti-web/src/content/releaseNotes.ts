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
    id: '2026-12-06',
    period: '23 Nov – 6 Dec 2026',
    date: '2026-12-06',
    version: '0.0.467',
    sections: [
      {
        id: 'listen',
        label: 'Listen',
        highlights: [
          'An artist’s own site (name.tahti.live) shows their header, colours and menu choices again, so it looks the way they designed it.',
          'The full-screen player is calmer: Add to playlist moved into the ⋯ menu with the other track actions, leaving the artwork and controls in focus.',
          'An artist’s short link page (tahti.live/u/name) shows their round profile picture again, instead of one large blurry picture covering the page.',
          'Listening parties moved to the bottom of Discover, so music picks come first.',
          'Artist pages get Albums and DJ sets tabs when the artist has album or DJ set series collections, so long mixes no longer sit between the albums.',
          'An artist’s own site (name.tahti.live) no longer has a tahti.live link in its top bar, so the header is just the artist.',
          'Tracks in your queue, favourites or history keep playing after a long break: when a saved link to the audio has expired, the player fetches a fresh one and carries on from the same spot.',
          'Cards stay put when you hover them: a soft outline shows instead of the card jumping sideways, so the edge of a row no longer gets cut off.',
          'Upcoming events now live only on Discover, where you go to find things to do, so Home stays about music you can play right away.',
          'Upcoming events on Discover is now one event poster at a time, glowing in the colours of its picture. Flip through with the arrows, a swipe or drag, or the arrow keys, and it loops back to the start. Start times use the 24-hour clock, with small icons for time, host and place.',
        ],
      },
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Studio → Music opens on Tracks. Each track shows a coloured status (processing, failed, public or private), types are tabs above the search, and the compact layout has larger cover art and easier-to-read text.',
          'Studio → Broadcast shows the red, blinking On air only while you are actually live; when just your 24/7 rotation plays it says Off air.',
          'Schedule → Events stays on the Upcoming, Past or Invites tab you pick, and an event invite notification opens straight on Invites.',
          'Links to your channel programme, from Broadcast, Channel design or an old bookmark, open Schedule on the Programme tab instead of the time slots.',
          'Studio → Channel shows the Tahti Radio panel once, with its own description, instead of a doubled panel.',
          'Sections you hide on your artist page (bio, gallery, feed and the rest) now stay hidden for every visitor and on your other devices, not just in the browser you hid them in.',
          'If the board’s daily check sees unusual download activity on your channel, you get a notification saying so, in Finnish or English, before anything about your units changes.',
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        highlights: [
          'Settings → Security is one page: change your password or email from a small edit button that opens the form in a window, with clear messages when an address looks wrong or the new password matches the old one. Two-factor authentication sits on the same page, and while it is off a friendly note suggests turning it on.',
          'Settings → Appearance is quieter: explanations sit behind a small question-mark icon. What visitors see on your profile (counts, connections, top lists, comments) moved to Studio → Profile → Visibility, and sub-pages have a round back arrow instead of a text link.',
          'Settings → Account is easier to read at a glance: your subscriptions and purchases share one tab with totals on top, each subscription shows a coloured status, and Storage shows used and free space as a ring chart.',
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        highlights: [
          'The admin dashboard is split into Health, Jobs, Monitoring and Activity tabs, and live channels, queues and cron jobs fit in a few compact rows, so the board sees what needs attention without scrolling through one long page.',
          'Grafana opens inside Admin → Monitoring again, and when it cannot load there you get a clear Open Grafana button instead of a blank frame.',
          'Every admin page opens the same way: its title, one line on what it is for, and a single back link, without a breadcrumb trail on top.',
          'A user in Admin → Users opens on Overview, Account and Tracks tabs. Tracks lists everything they uploaded, so you can play a track, make it public or private, or delete it without leaving the account.',
        ],
      },
    ],
  },
  {
    id: '2026-11-22',
    period: '9–22 Nov 2026',
    date: '2026-11-22',
    version: '0.0.436',
    sections: [
      {
        id: 'listen',
        label: 'Listen',
        highlights: [
          'Albums list their tracks in order with track numbers, so a record plays the way the artist meant it.',
          'On a channel, only the track you point at shows a play button, so a long list stays calm to read. Hold Shift to add a track to the queue instead of playing it.',
          'A radio station you add lands in the radio row with your other stations, right where you look for it.',
          'The Radio page fits on one screen: the player and your stations show without scrolling, and the station blurb waits behind a ? icon.',
          'Discover has an Upcoming events widget, and the Events tab opens with what is happening next.',
          'Playlist pages pick up a soft glow from their cover instead of a solid colour wall, so dark mode stays easy on the eyes.',
          'Visualizers take their colours from the artwork of the track that is playing.',
        ],
      },
      {
        id: 'listen',
        label: 'On phones',
        highlights: [
          'Track lists on phones have bigger artwork, one date per row and room for long titles, so they are easier to scan with a thumb.',
          'The full-screen player on phones has a Love button where Add to playlist used to be (it is still in the ⋯ menu).',
          'When nothing is playing, a small × hides the player bar so it is out of your way; it comes back as soon as you press play.',
        ],
      },
      {
        id: 'studio',
        label: 'Studio',
        highlights: [
          'Artists can drag their album tracks into order, and the board can fix the order of any album.',
          'Uploads named after files get clean titles: no track numbers, file endings or your own name in front.',
        ],
      },
      {
        id: 'admin',
        label: 'Admin',
        highlights: [
          'Board members can edit or remove Tahti news right from the news widget, and removing always asks first.',
          'The admin overview loads faster: the slowest checks are now cached for a few seconds instead of being recounted on every open.',
        ],
      },
      {
        id: 'settings',
        label: 'Language',
        highlights: [
          'The last English sentences on transparency, earnings, sign-up, DJ hints and the Discover widget menu now read in Finnish too.',
        ],
      },
    ],
  },
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
