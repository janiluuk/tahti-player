import { PLUGIN_HELP_TABLE } from './pluginHelpCatalog';

export type HelpTable = {
  columns: string[];
  rows: string[][];
};

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  /** Production deep-link on tahti.live — omit for POC-only articles with no prod equivalent. */
  productionPath?: string;
  sections: Array<{ heading: string; body: string[]; table?: HelpTable }>;
};

export const HELP_HUB_INTRO =
  'Guides for listening, broadcasting, add-ons, account tiers, and getting in touch.';

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-around',
    title: 'Getting around Tahti',
    description:
      'A simple map of Listen, Library, Studio, Settings, and the player controls.',
    sections: [
      {
        heading: 'The main areas',
        body: [
          'Listen is the starting point for finding music, channels, radio, and public pages. It is available without an account.',
          'Radio and Discover sit next to Listen in the sidebar. Favorites is its own sidebar item for saved channels and tracks.',
          'Library (signed in) holds sounds, collections, recordings, uploads, and related catalogue work under Studio.',
          'Studio is for artists: overview, branding, stats, posts, audience, go live, broadcast schedule, and channel controls.',
          'Help center and Settings live at the bottom of the sidebar. Settings covers account, themes, add-ons, and preferences.',
          'The right rail is your queue, chat, and — on desktop — a Library tab for local files you import this session. The player appears only after a track is loaded.',
        ],
      },
      {
        heading: 'What each area is for',
        body: [
          'Listen is home for continue-listening, community radio, and who’s on air. Feed shows posts from artists you follow; History is what you played recently.',
          'Discover has widgets, an artists directory (search and filters), and venues. Favorites holds saved channels, radio, and tracks.',
          'Studio section tabs (Overview, Branding, Stats, …) stay under the Studio nav. On pages with their own subtabs — Stats, Sounds, Branding, Updates, Channel, and similar — those subtabs sit directly under Studio’s nav row, above the page title.',
          'Press H for a guided tour of the controls on the current page. Longer how-tos live in this Help center.',
        ],
      },
      {
        heading: 'Signing in',
        body: [
          'You can browse and listen anonymously. Sign in before saving favorites, creating playlists, subscribing to artists, chatting, uploading, or using Studio.',
          'If a private area is opened while signed out, Tahti takes you to Settings → Account so you can sign in and continue.',
        ],
      },
    ],
  },
  {
    slug: 'for-listeners',
    title: 'Listener guide',
    description:
      'Find channels, support artists directly, download, and chat — no account required.',
    productionPath: '/help/for-listeners',
    sections: [
      {
        heading: 'Find something to listen to',
        body: [
          'Browse who’s on air from Listen, or open a channel at /channel/$slug.',
          'When an artist is offline, their channel still plays archive items.',
          'Tahti Radio (/radio) is a fair-rotation stream across the community.',
          'Discover has widgets, artists, and venues. Open Discover → Venues to browse verified venues, or Discover → Artists for the directory.',
          'Signed-in listeners can install Disco-widgets on Listen from Settings → Add-ons → Discovery.',
        ],
      },
      {
        heading: 'Support an artist',
        body: [
          'Open /u/$username and choose Subscribe — fan tiers are set by the artist.',
          'Most of what you pay goes to the artist; cancel any time from your account.',
        ],
      },
      {
        heading: 'Chat',
        body: [
          'Chat is open on live channels. Anonymous joining may require hCaptcha.',
          'Moderators can mute or remove disruptive messages.',
        ],
      },
    ],
  },
  {
    slug: 'player',
    title: 'Using the player',
    description:
      'Play tracks, manage the queue, use visualizations, and understand the player states.',
    sections: [
      {
        heading: 'Play something',
        body: [
          'Select a track or choose Play on a channel, release, playlist, or radio station. The current item appears in the player at the bottom of the app.',
          'When nothing is loaded, the player stays hidden so it does not take space from the page. Load a track to show the controls.',
          'On mobile, the bottom navigation gives way to the active player while music is playing so the controls remain easy to reach.',
        ],
      },
      {
        heading: 'Queue and visualizations',
        body: [
          'Use the queue control to see what is next, reorder your listening, or clear the queue. Previous and next move through the queue.',
          'Choose a visualization in Settings → Add-ons → Visualizers, or use the channel visualizer selected by an artist. Visualizations can be turned off when you want a quieter screen.',
        ],
      },
    ],
  },
  {
    slug: 'favorites-playlists',
    title: 'Favorites and playlists',
    description:
      'Save tracks, artists, channels, and playlists, then keep your own listening lists organized.',
    sections: [
      {
        heading: 'Save and find favorites',
        body: [
          'Use the heart or Favorite action on a track, playlist, channel, or artist. Open Favorites in the sidebar to play, queue, or unfavorite saved channels and tracks.',
          'Favorites are ordered from newest to oldest.',
        ],
      },
      {
        heading: 'Create a playlist',
        body: [
          'Open Library → Collections (or Studio → Collections) and create a playlist collection. Give it a name, add tracks, and choose whether it is public.',
          'A public playlist can be discovered, subscribed to, played, and embedded. Private playlists remain visible only to you.',
        ],
      },
    ],
  },
  {
    slug: 'comments-and-timeline',
    title: 'Comments and timeline reactions',
    description:
      'Leave a comment at the exact moment you are hearing in a full-track view.',
    sections: [
      {
        heading: 'Comment on a moment',
        body: [
          'Open a full track view and pause or seek to the moment you want to discuss. The reaction row below the timeline shows emoticons and the comment action.',
          'Choose an emoticon to react at that timestamp. Choose the comment icon to open the comment field; your comment is prefixed with the current time so others know exactly where to listen.',
          'You must be signed in to post. Artists can disable comments on an individual track from its Studio settings.',
        ],
      },
    ],
  },
  {
    slug: 'for-artists',
    title: 'Artist guide',
    description:
      'Create your channel, go live, upload sets, and share your public links.',
    productionPath: '/help/for-artists',
    sections: [
      {
        heading: 'Create your channel',
        body: [
          'In Studio, set your channel slug — your public channel is /channel/your-slug, and your artist profile is /u/your-username.',
          'Use the Studio tools to broadcast, manage music, plan shows, understand your audience, and design your channel.',
        ],
      },
      {
        heading: 'Go live & publish',
        body: [
          'Copy RTMP or Icecast credentials from the broadcast studio, then stream from OBS, Mixxx, or Traktor.',
          'Upload archive sets and releases from the studio; they appear on your channel and profile.',
        ],
      },
      {
        heading: 'Artist gallery',
        body: [
          'Open Studio → Branding → Gallery to add photos to your public artist page. Use the plus icon in the gallery header to upload — there is no separate Add images button.',
          'Turn Public on so the gallery appears on your profile, or leave it off while you arrange photos.',
          'Drag a photo to reorder it, or use the arrows on hover. Check photos to select them, then remove the ones you do not want.',
          'Photos you include can also appear in your press kit. Channel backdrops and slideshows are covered in Design your channel.',
        ],
      },
      {
        heading: 'Studio pages',
        body: [
          'Subtabs for a Studio page sit under the Studio navigation row and above the page title — the same layout as Stats (Overview / Plays / Top lists).',
          'Sounds holds your archive and files. Branding covers profile picture, gallery, press kit, and Channel Designer. Updates is posts and newsletter. Channel covers stream keys, radio settings, and multicast.',
          'Admin Moderation queues (support, beta, radio, reports) use the same pattern under Admin nav.',
        ],
      },
      {
        heading: 'Fan support and orders',
        body: [
          'Studio → Audience lists latest fan-sub orders, payout statistics, and the split of a typical order.',
          'Open the earnings guide from that page for Stripe fees, the 2% operational fee, and grants.',
        ],
      },
    ],
  },
  {
    slug: 'channel-design',
    title: 'Design your channel',
    description:
      'Use Channel designer to shape your header, player, background, overlays, and visualizer.',
    sections: [
      {
        heading: 'Choose a look',
        body: [
          'Open Studio → Branding → Channel Designer. The preview shows what listeners see on your public channel and artist page.',
          'Pick a block from the element menu: releases, tracks, latest, feed, news, player, or backdrop. Hide a block with the eye button.',
          'Player controls the stage, visualizer, gradient, and overlay. Backdrop controls header style, slideshow, and page colors.',
        ],
      },
      {
        heading: 'Add a backdrop or gallery',
        body: [
          'Use a video, still image, or slideshow as a backdrop. Once a backdrop exists, the designer shows the remove action instead of another add action.',
          'Save layout after changes. A backdrop is optional; if none is set, the selected gradient or visualizer fills the space.',
        ],
      },
    ],
  },
  {
    slug: 'desktop-library',
    title: 'Desktop library and Soulseek',
    description:
      'Import local files into the player from the right-rail Library tab, and how Soulseek will connect later.',
    sections: [
      {
        heading: 'Local library (desktop)',
        body: [
          'On a wide desktop window, the right rail has a Library tab next to Chat, Notifications, and Queue. Choose audio files there to play them in the shared Tahti player.',
          'Those files stay on this device for this browser session. Reloading the page clears the list. Uploading into your Tahti archive is still Studio → Upload.',
          'Phones keep Chat, Notifications, and Queue only — the Library rail is desktop-only for now.',
        ],
      },
      {
        heading: 'Soulseek',
        body: [
          'Soulseek is peer-to-peer. Tahti does not search or transfer files through its servers. A later desktop add-on will connect with your own Soulseek account from the Tahti Player app.',
          'Until that native bridge ships, Settings → Add-ons → Import shows a Configure dialog that explains the limit. Use the Library tab to import files you already have.',
          'You are responsible for what you share and download. Only use material you have the rights to.',
        ],
      },
    ],
  },
  {
    slug: 'uploads-and-processing',
    title: 'Upload and processing',
    description:
      'Upload tracks and sets, follow their progress, and find them when processing is complete.',
    sections: [
      {
        heading: 'Upload audio',
        body: [
          'Open Studio → Upload (also available from Library → Upload), choose an audio file, and complete the metadata. New uploads without artwork receive an abstract thumbnail automatically.',
          'Use the archive item page to add artwork, a backdrop, a tracklist, visibility, comments, downloads, and release information.',
        ],
      },
      {
        heading: 'Follow processing',
        body: [
          'While an upload or provider download is processing, the top-left navigation shows a blue processing indicator. Open it to see queued and active items.',
          'When processing finishes, the indicator clears and a notification links you directly to the track. Processing can take time for long recordings or provider imports.',
        ],
      },
    ],
  },
  {
    slug: 'broadcast',
    title: 'Broadcast setup',
    description:
      'Connect OBS, Streamlabs, Mixxx, or Traktor to your Tahti stream key.',
    productionPath: '/help/broadcast',
    sections: [
      {
        heading: 'OBS / Streamlabs (RTMP)',
        body: [
          'Dashboard → Go Live → copy Server and Stream Key.',
          'OBS → Settings → Stream: Service Custom, paste server and key.',
          'Audio bitrate 128–192 kbps AAC. Start Streaming — channel shows Live when ingest connects.',
          'Go Live has a "Ready-made OBS setup" download that bundles a scene preset with this channel\'s current server and stream key already filled in, if you would rather import a profile than type the values in by hand.',
        ],
      },
      {
        heading: 'Traktor, Mixxx, and other Icecast-compatible apps',
        body: [
          'Go Live → Connect broadcasting software → choose Traktor or Icecast to see the matching Server, Mount, and Password fields for that app.',
          'Paste those values into the broadcasting section of your audio app, then enable its On Air / broadcast control the same way you would in OBS.',
        ],
      },
      {
        heading: 'Phone',
        body: [
          'Same RTMP credentials work in Larix Broadcaster and similar apps.',
        ],
      },
    ],
  },
  {
    slug: 'releasing',
    title: 'Releasing music',
    description:
      'A simple guide to preparing a release, choosing identifiers, and sharing it everywhere.',
    productionPath: '/help/releasing',
    sections: [
      {
        heading: 'Which release method should I use?',
        body: [
          'You do not need every method. Choose the ones that match what you already have.',
          'UPC / EAN is the barcode that identifies the whole release. Use it when a label, distributor, or barcode provider has given you one.',
          'MusicBrainz is a community-maintained music catalog. Use it when you want your release and artist information to be part of an open public database.',
          'Discogs is another community catalog, especially useful for physical releases and historical editions.',
          'Smart links collect the places where people can listen — such as Spotify, Apple Music, Bandcamp, SoundCloud, YouTube Music, and Tidal — onto one Tahti page.',
          'Delivery sends eligible release information to a distribution service such as Revelator. It is the automated option for delivering music to supported DSPs; fees or requirements may apply.',
        ],
      },
      {
        heading: 'A straightforward release workflow',
        body: [
          'Create the release in Studio → Releases and add the final tracklist, artwork, date, and description.',
          'Open Release ops → Catalog & credits. Turn on only the methods you want to use; each method then shows the fields it needs.',
          'Save your catalog information. Export JSON when you want a portable copy of the release metadata.',
          'Use the Guides icons for MusicBrainz or Discogs. Their Copy prefill actions prepare the title, barcode, credits, and tracklist for you, while the external links open the relevant service.',
          'After submitting to an external catalog, copy its release or artist ID back into Tahti so the connection is recorded.',
        ],
      },
      {
        heading: 'MusicBrainz in plain language',
        body: [
          'Open the MusicBrainz release editor from the Guide. Choose the release type, enter the artist and date, add the tracks in order, and save the entry.',
          'MusicBrainz is not a music store and does not deliver audio to Spotify. It is an open reference catalog, so use it for accurate public metadata and identification.',
        ],
      },
      {
        heading: 'Discogs in plain language',
        body: [
          'Search Discogs before creating a new entry so you do not duplicate an existing release.',
          'Use Discogs for cataloging an edition, label, format, country, date, barcode, and tracklist. It is especially useful when documenting vinyl, CD, or other physical versions.',
        ],
      },
      {
        heading: 'What the technical fields mean',
        body: [
          'A release MBID is MusicBrainz’s unique ID for the release. An artist MBID identifies the artist there. A Discogs release ID identifies the Discogs entry.',
          'P-line describes who owns the recording copyright. C-line describes who owns the artwork or publishing copyright. Label imprint is the label name shown with the release.',
          'If you do not know a field, leave that method switched off or ask your label/distributor. Do not invent identifiers.',
        ],
      },
    ],
  },
  {
    slug: 'multistream',
    title: 'Multistream',
    description:
      'Mirror your live broadcast to YouTube, Twitch, and other platforms.',
    productionPath: '/help/multistream',
    sections: [
      {
        heading: 'How it works',
        body: [
          'Stream once to Tahti. Multistream targets are configured in the studio — do not point OBS at YouTube/Twitch keys directly if Tahti is already mirroring.',
          'Supported destinations include YouTube Live, Twitch, Facebook Live, Kick, Mixcloud, and others when RTMP keys are available.',
        ],
      },
    ],
  },
  {
    slug: 'embed-and-share',
    title: 'Share and embed music',
    description:
      'Share public tracks, releases, playlists, and artist pages or place them on another site.',
    sections: [
      {
        heading: 'What can be shared',
        body: [
          'Public artist pages, channels, tracks, releases, and playlists have share links. Unlisted links work for people who have the link but do not appear in discovery.',
          'A public playlist can be subscribed to by signed-in listeners. Subscribing keeps it easy to find without copying its tracks into your own playlist.',
        ],
      },
      {
        heading: 'Embed a public page',
        body: [
          'Choose Embed on a public track, release, playlist, or channel, copy the iframe code, and paste it into a site that accepts embeds.',
          'The page must remain public for the embed to work. Provider-hosted tracks continue to use the provider widget inside the embed.',
        ],
      },
    ],
  },
  {
    slug: 'tier-limits',
    title: 'Free tier vs membership',
    description:
      'Live-hour limits, audio quality, and what changes when you support Tahti ry.',
    productionPath: '/help/tier-limits',
    sections: [
      {
        heading: 'Free-tier artist',
        body: [
          'About 1 hour of live broadcasting per week (resets Monday 00:00 UTC).',
          'Listeners hear MP3 ~192 kbps HLS; archive plays when you are offline.',
        ],
      },
      {
        heading: 'Tahti ry member',
        body: [
          'Unlimited live time and cooperative support (€40/year membership).',
          'Membership is support for the org, not a consumer “plan”.',
        ],
      },
    ],
  },
  {
    slug: 'earnings',
    title: 'Earnings and fan-sub orders',
    description:
      'How a fan-sub order splits, where payouts appear, and how grants sit on top.',
    sections: [
      {
        heading: 'Where to look',
        body: [
          'Studio → Audience is the order management screen: latest fan-sub orders, subscriber and payout statistics, and a breakdown of a typical €5 order.',
          'When Stripe is enabled, Studio also adds a Stripe dashboard for your payout account and the Express dashboard. Press H, or the help icon on Audience, for a guided tour.',
        ],
      },
      {
        heading: 'The money flow',
        body: [
          'A listener pays you monthly through Stripe. On a €5 order, Stripe keeps about €0.45 (2.9% + €0.30), Tahti keeps €0.10 as a 2% operational fee, and you receive €4.45 via Stripe Connect in the ledger model.',
          'That split is what Audience and this guide show. The sibling payout runbook (`../tahti-org/docs/flows/payouts.md`) still tracks whether the live Stripe balance transaction always matches €4.45 — treat the on-screen number as the documented flow, not a guaranteed bank deposit until that check closes.',
          'The 2% fee covers Connect platform costs, billing support, disputes, and GDPR work. It is operational, not org profit — leftover from that line rolls into the next artist grant pool.',
        ],
      },
      {
        heading: 'When a fan cancels',
        body: [
          'They keep perks until the billing period ends, then about seven days of grace. You do not need to do anything — the order list updates on its own.',
        ],
      },
      {
        heading: 'Grants sit on top',
        body: [
          'Downloads and fan-sub euros also count toward yearly engagement units. Eligible artists share the cooperative grant pool — that is extra to the money already paid out on each order.',
        ],
      },
    ],
  },
  {
    slug: 'keyboard-shortcuts',
    title: 'Keyboard shortcuts',
    description:
      'Every global shortcut in the app, including the guided page tour.',
    sections: [
      {
        heading: 'Page tour',
        body: [],
      },
      {
        heading: 'Navigation',
        body: [],
      },
      {
        heading: 'Player',
        body: [],
      },
      {
        heading: 'Notes',
        body: [],
      },
    ],
  },
  {
    slug: 'add-ons',
    title: 'Add-ons and plugins',
    description:
      'What is ready today in Settings → Add-ons, and how to turn each one on.',
    sections: [
      {
        heading: 'Where add-ons live',
        body: [
          'Open Settings → Add-ons. Categories match the table below: Themes, Visualizers, Import, Multicast, Fingerprinting, Audio plugins, Radio, Embed, Discovery, Channel, Playback, and Scrobbling.',
          'Only integrations you can use now are listed. ListenBrainz and Last.fm scrobbling are ready (submit-listens / track.scrobble only). Planned Nuclear registry items such as ListenBrainz charts, OmniSource, KHInsider, and NetEase stay out of this guide until they have a Tahti contract.',
        ],
      },
      {
        heading: 'Ready plugins',
        body: [
          'State Ready means the path works end to end, including in-app playback where the row says so. Importer ready or Search ready means the connect/search half works, but the remaining piece — usually a server-side import contract — is still pending; check the “How to use it” column for the exact limit.',
          'hearthis.at, Mixcloud, Spotify, and Bandcamp tracks are referenced rather than hosted: Tahti keeps only a link, and that provider’s own widget supplies the audio when you press play on one of their tracks, including on a track’s own page.',
        ],
        table: PLUGIN_HELP_TABLE,
      },
      {
        heading: 'If something is missing',
        body: [
          'Export destinations such as Spotify or Apple Music are release-delivery links in Studio → Distribution, not installable plugins yet.',
          'Import sources are managed from Add-ons → Import. Only sources with a working Tahti runtime are shown there.',
        ],
      },
    ],
  },
  {
    slug: 'desktop-mcp',
    title: 'Desktop app & AI tools (MCP)',
    description:
      'Control playback from Claude, Cursor, or another AI tool using the separate Tahti Player desktop app.',
    sections: [
      {
        heading: 'This is a separate app, not this website',
        body: [
          'AI-tool control uses the Model Context Protocol (MCP) and only runs inside the Tahti Player desktop app (Tauri), not on this website — a browser tab can’t host the local server an AI tool connects to.',
          'If you only use tahti.live in a browser, this feature isn’t available to you yet; everything else in this guide still applies to the web app as usual.',
        ],
      },
      {
        heading: 'Turn it on in the desktop app',
        body: [
          'Open the Tahti Player desktop app → Settings → Integrations, then toggle Enable MCP Server on.',
          'The server starts at http://127.0.0.1:8800/mcp (localhost only, never exposed to the network). If that port is busy it tries the next one up to 8809 — the exact URL is shown in the MCP Server URL field, with a copy button.',
          'Point your AI tool at that URL using the Streamable HTTP transport. It can then control queue, playback, favorites, playlists, and more — the same things you can do by hand in the app.',
        ],
      },
    ],
  },
  {
    slug: 'notifications',
    title: 'Notifications',
    description:
      'Keep track of likes, follows, processing results, messages, and other account activity.',
    sections: [
      {
        heading: 'What appears here',
        body: [
          'The notification bell shows activity that matters to your account, including likes on your content, new followers, and completed processing jobs.',
          'Processing notifications link back to the finished track so you can review its metadata and publishing settings.',
          'The blue light in the top-left navigation is reserved for work still in progress; open it to see the current status.',
        ],
      },
    ],
  },
  {
    slug: 'governance',
    title: 'Governance and member decisions',
    description:
      'Find discussions, advisory votes, member motions, meetings, and public records.',
    sections: [
      {
        heading: 'Where governance lives',
        body: [
          'Listeners open Governance from Settings → Account. Artists use Studio → Governance. Board users use Admin → Governance and Admin → AGM.',
          'The active subtab always follows the page you opened, so you can use browser back and shared links without losing your place.',
        ],
      },
      {
        heading: 'Advisory consultation and official votes',
        body: [
          'Advisory discussions and votes collect member input. They are clearly separate from binding association decisions.',
          'Do not treat an advisory result as an official AGM ballot. Official records are published when the association’s eligibility, quorum, ballot, minutes, and result contracts are in place.',
        ],
      },
    ],
  },
  {
    slug: 'admin-guide',
    title: 'Admin guide',
    description:
      'A map of the tools board and admin users use to operate Tahti safely.',
    sections: [
      {
        heading: 'Admin areas',
        body: [
          'Dashboard and Status show platform health. Logs show service activity. Moderation handles support, beta, radio, reports, and feature queues.',
          'Users, Content, Radio, Streams, Storage, News, Venues, Top lists, and Announcements manage the everyday platform surfaces.',
          'Governance and AGM hold member records. Disco-widgets manages approved add-ons. Artwork presets manages the abstract defaults used for artwork-free uploads.',
          'Orphan pages (/admin/orphan-pages) gathers real admin pages that shipped without a menu entry of their own — each is its own tab there rather than lost at an unlinked URL.',
        ],
      },
      {
        heading: 'Safety and access',
        body: [
          'Admin pages require an authorized board or admin account. Changes should be made through the existing form, confirmation, and audit surfaces so they remain reviewable.',
          'If a tool is not visible, your account may not have the required role or the feature may not yet be enabled in production.',
        ],
      },
    ],
  },
  {
    slug: 'disco-widgets',
    title: 'Contribute a Disco-widget',
    description:
      'Build a sandboxed add-on for Listen, an artist channel, or the homepage, then submit it for review.',
    productionPath: '/help/disco-widgets',
    sections: [
      {
        heading: '1. Build it',
        body: [
          'Use the @tahti/widget-sdk package in the tahti-org repository. packages/widget-sdk/README.md walks through the contract (what a widget exports, how it talks to the host page, and the size/security limits it runs under). packages/widget-sdk/example/live-status/ is a complete working example.',
          'A widget runs only inside a sandboxed iframe (no cookies, no parent DOM). It talks to the host with a small postMessage protocol: ready, init, resize, and same-origin open-link.',
        ],
      },
      {
        heading: '2. Open a pull request',
        body: [
          'Fork tahti-org and add your widget under contrib/disco-widgets/<your-widget-slug>/ — include src/index.ts, a short README describing the scope (listener, artist, or admin), and any config it expects.',
          'In the PR, say what it is for and give concrete steps a reviewer can follow to verify it (build the bundle, load it in the sandbox, confirm it renders with representative context).',
        ],
      },
      {
        heading: '3. What happens next',
        body: [
          'A maintainer reviews the code. Once merged, an admin builds the widget, publishes it through the Disco-widgets admin panel, and approves it. After that it is live in its store, credited to you.',
          'Install listener widgets from Settings → Add-ons → Discovery. Artists install channel widgets from Settings → Add-ons → Channel; they render on /channel/$slug and /u/$username.',
        ],
      },
    ],
  },
  {
    slug: 'support',
    title: 'Contact support',
    description:
      'Reach the Tahti team about your account, billing, or a technical issue.',
    productionPath: '/help/support',
    sections: [
      {
        heading: 'Get help',
        body: [
          'Use the form below for account, billing, engagement, or technical issues.',
          'Include a short description so the team can help quickly. Signed-in requests use your account email automatically.',
        ],
      },
    ],
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
