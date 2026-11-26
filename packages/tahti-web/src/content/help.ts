import type { ContentLocale } from '../lib/contentLocale';
import { HELP_ARTICLES_FI } from './help.fi';
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

export type HelpArticleTranslation = {
  title: string;
  description: string;
  sections: Array<{ heading: string; body: string[]; table?: HelpTable }>;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-around',
    title: 'Getting around Tahti',
    description:
      'A simple map of Listen, Library, Studio, Settings, and the player controls.',
    sections: [
      {
        heading: 'What is tahti.live?',
        body: [
          'tahti.live is a nonprofit broadcasting platform for independent artists — built to support artists, not algorithms. Listening is free and lossless on member channels. Artist membership funds your own channel, releases, and live shows — see Settings → Account → Membership for current terms.',
          'One member, one vote: proposals and the AGM govern the platform, not a company board. Nearly all fan-support money goes to the artist, and the code is open source under AGPL.',
          'See the full pitch — plans, funding, and governance — at /what-is-it. Where the money goes is public at /transparency.',
        ],
      },
      {
        heading: 'The main areas',
        body: [
          'Listen is the starting point for finding music, channels, radio, and public pages. It is available without an account.',
          'Radio and Discover sit next to Listen in the sidebar. Favorites is its own sidebar item for saved channels and tracks.',
          'Library (signed in) has Favorites, Playlists, History, Following, and Files. Your own uploads, releases and collections live in Studio → Music.',
          'Studio is for artists. Its top row is Home, Music, Broadcast, Channel, Fans, Stats, and Profile.',
          'Help center and Settings live at the bottom of the sidebar. Settings covers account, security, notifications, playback, appearance, and add-ons.',
          'The right rail is the queue (Show queue in the player). Notifications and messages open from your avatar, top right. Local audio from disk is desktop-only (Library → Files → Local files in the Tahti Player app). The player appears only after a track is loaded.',
        ],
      },
      {
        heading: 'What each area is for',
        body: [
          'Listen is home for continue-listening, community radio, and who’s on air. History is what you played recently.',
          'Discover has tabs for widgets, Feed (posts from artists you follow), Events, Parties, Artists, Groups, and Venues. Favorites holds saved channels, radio, and tracks.',
          'Studio’s top row stays on screen on every Studio page, Go live included. Music, Broadcast, Channel, and Profile have their own sub-tabs right under it, above the page title. The Channel designer is Studio → Channel → Design; logo, gallery, and press kit are under Studio → Profile.',
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
          'Tahti Radio (/radio) is a fair-rotation stream across the community. Open the calendar on Radio for the full programme schedule (/schedule), or book a slot when you are signed in.',
          'Discover has widgets, the Feed, Events, listening Parties, Artists, Groups, and Venues. Open Discover → Venues to browse verified venues, or Discover → Artists for the directory.',
          'Run a venue? Register it from Discover → Venues. My venues (/venues/mine) shows whether the board has verified it, and lets you edit its details and book or cancel shows there.',
          'Signed-in listeners can install Disco-widgets on Listen from Settings → Add-ons → Discovery.',
        ],
      },
      {
        heading: 'Support an artist',
        body: [
          'Open /u/$username and choose Subscribe — fan tiers are set by the artist.',
          'Most of what you pay goes to the artist. Your subscriptions and purchases are listed in Settings → Account → Subs & purchases, where you can cancel any time.',
        ],
      },
      {
        heading: 'Chat',
        body: [
          'Live chat lives on each channel page (and at /chat/$slug for that channel). Open a channel that is on air or has chat enabled.',
          'Messages (/messages) are private direct messages between accounts, not channel chat.',
          'Anonymous joining on a live channel may require hCaptcha. Moderators can mute or remove disruptive messages.',
        ],
      },
      {
        heading: 'Listen together',
        body: [
          'On a public playlist or collection page, choose Start a Jam to open a shared listening session and invite others with the link.',
          'This is different from the desktop Tahti Jam remote (Settings → Playback → Integrations in the desktop app), which controls the desktop player from your phone.',
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
          'On a phone, the player sits above the bottom navigation. Minimize player shrinks it to a slim strip that still plays and pauses; tap the strip to bring the full bar back. Tahti remembers your choice.',
        ],
      },
      {
        heading: 'Full-screen player',
        body: [
          'Choose Open full-screen player (or press V) for a large view with artwork and the visualizer. Swipe left or right to change track; Minimize player closes it.',
          'Driving mode gives big, simple controls. Settings → Playback → Keep the screen on in full screen stops a phone from dimming while it plays.',
          'Settings → Appearance → Full-screen title change picks how the track name changes: Fade, Slide up, Soft scale, or Slide sideways. With reduced motion on, it changes without movement.',
        ],
      },
      {
        heading: 'Queue and visualizations',
        body: [
          'Show queue opens the queue in the right rail: see what is next, reorder, remove, clear, or save it as a playlist. Previous and next move through the queue. Shuffle and Repeat are in Settings → Playback.',
          'Choose a visualization in Settings → Add-ons → Visualizers, or use the channel visualizer selected by an artist. Visualizations can be turned off when you want a quieter screen.',
        ],
      },
      {
        heading: 'Track rows',
        body: [
          'Channel tracks, an artist’s popular tracks, playlists and Listen’s new tracks show each track as a row: the round play button, the genre and length, and the waveform, which you can click or drag to jump within the playing track.',
          'Under the waveform: the heart with a count loves the track (signed in), then add to queue, add to a playlist, and download when the artist allows it. On the right are the release date and how many likes, plays, downloads and comments the track has.',
          'The same rows show on liked tracks, playlists, release pages and the channel Playlist widget; a track page shows its plays too.',
          'A track page also lists, in tabs, the public collections the track is in and who liked, reposted and played it (signed-in listeners only; anonymous plays are never shown). Show more loads the rest of a tab.',
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
          'Use the heart on a track to like it: liked tracks are saved to your account and listed under Library → Favorites → Liked tracks on every device. Use Favorite on a playlist, channel, artist or radio station to keep it in Favorites.',
          'Favorites are ordered from newest to oldest.',
        ],
      },
      {
        heading: 'Create a playlist',
        body: [
          'Open Library → Playlists and choose Create playlist, or use Add to playlist on any track. Give it a name, add tracks, and choose whether it is public. Artists also keep collections in Studio → Music → Collections.',
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
    slug: 'shared-jam',
    title: 'Shared listening (Jam)',
    description:
      'Start a Jam from a playlist so guests hear the same queue in sync.',
    productionPath: '/help/shared-jam',
    sections: [
      {
        heading: 'Start a Jam',
        body: [
          'Open a public playlist or collection (Library → Playlists, or someone else’s public collection page). Choose Start a Jam.',
          'Share the /jam/$code link. Guests join in the browser; the host keeps control of play, pause, and the queue unless co-control is enabled for a guest.',
          'When the Jam ends, everyone returns to Listen. Invalid or ended codes show a clear error on the Jam page.',
        ],
      },
      {
        heading: 'Not the desktop remote',
        body: [
          'Desktop Tahti Jam (Settings → Playback → Integrations → Tahti Jam, desktop app only) is a phone remote for the desktop player on your LAN. Shared listening Jams are separate web sessions on beta.tahti.live / tahti.live.',
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
        heading: 'Broadcast & publish',
        body: [
          'Open Studio → Broadcast → Go live, copy the RTMP or Icecast credentials, then stream from OBS, Mixxx, or Traktor.',
          'Upload archive sets and releases from Studio → Music; they appear on your channel and profile.',
          'Distribution is a Studio → Music tab next to Releases — delivery status and royalties. Studio home and the Releases page also link there when you have releases.',
        ],
      },
      {
        heading: 'Artist gallery',
        body: [
          'Open Studio → Profile → Gallery & press kit to add photos to your public artist page. Use the plus icon in the gallery header to upload — there is no separate Add images button.',
          'Turn Public on so the gallery appears on your profile, or leave it off while you arrange photos.',
          'Drag a photo to reorder it, or use the arrows on hover. Check photos to select them, then remove the ones you do not want.',
          'Photos you mark Include in press kit appear in the press kit, which promoters download as a ZIP. Channel backdrops and slideshows are covered in Design your channel.',
        ],
      },
      {
        heading: 'Studio pages',
        body: [
          'Home shows your account status, quick Upload, Create release and Go live buttons, and recent activity.',
          'Music: Tracks, Releases, Collections, Distribution, Editor, Groups. Broadcast: Go live, Schedule, Shows, plus events, listening parties and recordings. Channel: Design, Radio, Settings, Visibility, Address. Profile: Identity, Links, Link page, Branding, Gallery & press kit.',
          'Fans gathers Posts, Newsletter, Chat, Memberships, Store and Earnings. Stats has Overview, Plays, Audience and Top lists, with Insights per track.',
          'Admin Moderation queues (support, beta, radio, reports) use the same pattern under Admin nav.',
        ],
      },
      {
        heading: 'Fan support and orders',
        body: [
          'Studio → Fans → Earnings lists latest fan-sub orders, payout statistics, and the split of a typical order.',
          'Open the earnings guide from that page for where fan-sub orders and grants appear in Studio.',
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
          'Open Studio → Channel → Design. The preview shows what listeners see on your public channel and artist page.',
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
    title: 'Local files and Soulseek',
    description:
      'Import local audio from Library → Files → Local files, and how Soulseek will connect later.',
    sections: [
      {
        heading: 'Local files',
        body: [
          'Library → Files → Local files is part of the Tahti Player desktop app. It indexes folders on your machine and plays them in the shared Tahti player.',
          'On the website (tahti.live) that tab is hidden — use Studio → Upload to put audio into your Tahti archive instead.',
        ],
      },
      {
        heading: 'Soulseek',
        body: [
          'Soulseek is peer-to-peer. Tahti does not search or transfer files through its servers. A later desktop add-on will connect with your own Soulseek account from the Tahti Player app.',
          'Until that native bridge ships, Settings → Add-ons → Import shows a Configure dialog that explains the limit.',
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
      {
        heading: 'Add music from Mikseri.net',
        body: [
          'Open a collection in Studio and use "Add your music from Mikseri.net": paste the Mikseri song page, its official embed URL, or the numeric track ID, then enter the title and artist name.',
          'Confirm that you own the track or have permission to embed it. Tahti keeps only the embed reference and your details; the audio stays on Mikseri.net and plays in its player.',
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
          'Studio → Broadcast → Go live → Stream credentials: copy Server and Stream key.',
          'OBS → Settings → Stream: Service Custom, paste server and key.',
          'Audio bitrate 128–192 kbps AAC. Start Streaming — channel shows Live when ingest connects.',
          'Stream credentials has a "Ready-made OBS setup" download that bundles a scene preset with this channel\'s current server and stream key already filled in, if you would rather import a profile than type the values in by hand.',
        ],
      },
      {
        heading: 'Traktor, Mixxx, and other Icecast-compatible apps',
        body: [
          'Studio → Broadcast → Go live → Stream credentials → choose Traktor or Icecast to see the matching Server, Mount, and Password fields for that app.',
          'Paste those values into the broadcasting section of your audio app, then enable its On Air / broadcast control the same way you would in OBS.',
        ],
      },
      {
        heading: 'Phone',
        body: [
          'Same RTMP credentials work in Larix Broadcaster and similar apps.',
        ],
      },
      {
        heading: 'Go live step by step',
        body: [
          'Go live walks through Show info (name, type, visibility), Stream credentials, Encoder signal, Recording, Destinations, and Green room. Show info and Encoder signal are required; the rest are optional.',
          'Choose Start broadcast when the encoder signal is in, and End broadcast when you are done. The Studio navigation stays on screen the whole time.',
          'Turn on Record broadcast to keep the show as a track. Green room lets invited guests listen in before you go on air.',
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
          'Stream once to Tahti. Add multistream targets in Studio → Broadcast → Go live → Destinations — do not point OBS at YouTube/Twitch keys directly if Tahti is already mirroring.',
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
          'Unlimited live time and cooperative support through membership.',
          'Membership is support for the org, not a consumer “plan”. Current terms live under Settings → Account → Membership.',
          'Members see more on Governance (/governance): the current board, board elections (stand for election or withdraw while nominations are open), the published annual reports, and the association’s registered details and auditors.',
          'Something wrong in your member details or a published record? Use Request a correction on Governance; the board’s answer appears there, and you can withdraw a request while it waits.',
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
          'Studio → Fans → Earnings is the order management screen: latest fan-sub orders, subscriber and payout statistics, and the live split for each order.',
          'When Stripe is enabled, Studio also adds a Stripe dashboard for your payout account and the Express dashboard. Press H, or the help icon on Audience, for a guided tour. Your Stripe dashboard shows what actually reached you.',
        ],
      },
      {
        heading: 'The money flow',
        body: [
          'A listener pays you monthly through Stripe Connect. Platform and card fees come off the top; the rest is yours. Studio → Fans → Earnings shows the live numbers for each order — use that screen, not this guide, as the source of truth.',
          'Operational fees that stay with Tahti fund Connect platform costs, billing support, disputes, and GDPR work. Leftover from that line rolls into the next artist grant pool.',
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
          'Downloads and fan-sub euros also count toward yearly engagement units. Eligible artists share the cooperative grant pool — that is extra to the money already paid out on each order. Pattern detection flags tidy fake activity (batch accounts, even intervals, IP clusters, reciprocal rings) for board review on the grant cycle; units are never docked silently.',
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
    title: 'Add-ons',
    description:
      'What is ready today in Settings → Add-ons, and how to turn each one on.',
    sections: [
      {
        heading: 'Where add-ons live',
        body: [
          'Open Settings → Add-ons. Categories match the table below: Themes, Visualizers, Import, Multicast, Fingerprinting, Audio tools, Radio, Embed, Discovery, Channel, and Playback. Scrobbling lives in Settings → Playback → Integrations.',
          'Only integrations you can use now are listed. ListenBrainz and Last.fm scrobbling are ready (submit-listens / track.scrobble only). Planned Nuclear registry items such as ListenBrainz charts, OmniSource, KHInsider, and NetEase stay out of this guide until they have a Tahti contract.',
        ],
      },
      {
        heading: 'Ready add-ons',
        body: [
          'State Ready means the path works end to end, including in-app playback where the row says so. Importer ready or Search ready means the connect/search half works, but the remaining piece — usually a server-side import contract — is still pending; check the “How to use it” column for the exact limit.',
          'hearthis.at, Mixcloud, Spotify, and Bandcamp tracks are referenced rather than hosted: Tahti keeps only a link, and that provider’s own widget supplies the audio when you press play on one of their tracks, including on a track’s own page.',
        ],
        table: PLUGIN_HELP_TABLE,
      },
      {
        heading: 'If something is missing',
        body: [
          'Export destinations such as Spotify or Apple Music are release-delivery links in Studio → Distribution, not installable add-ons yet.',
          'Import sources are managed from Add-ons → Import. Only sources with a working Tahti runtime are shown there.',
        ],
      },
    ],
  },
  {
    slug: 'desktop-mcp',
    title: 'AI tools (MCP)',
    description:
      'Let Claude, Cursor or another AI tool search Tahti and manage your likes, follows and playlists, or control the desktop app.',
    sections: [
      {
        heading: 'Two ways to connect',
        body: [
          'Your Tahti account: an AI tool connects to the Tahti API with a personal API token. This works wherever you use Tahti, including this website.',
          'The desktop app: an AI tool connects to the Tahti Player app on your computer and controls what it plays, its queue, your desktop library and radio.',
        ],
      },
      {
        heading: 'Connect your Tahti account',
        body: [
          'Create a token in Settings → Security → API tokens. A read-only token can search and list your likes and playlists; give it write access if the tool should also like tracks, follow artists and create or fill playlists.',
          'Point your AI tool at the MCP server URL shown above the token list, with the Streamable HTTP transport, and send the token as a bearer token. For Claude Code: claude mcp add tahti-account --transport http <URL> --header "Authorization: Bearer <token>".',
          'Anything the tool does is done as you, with the same rules as the website. Revoke the token to cut it off at once.',
        ],
      },
      {
        heading: 'Turn it on in the desktop app',
        body: [
          'Open the Tahti Player desktop app → Settings → Playback → Integrations and turn on MCP server. The switch is remembered, so the server starts again with the app.',
          'The server starts at http://127.0.0.1:8800/mcp. If that port is busy it tries the next one up to 8809; the row shows the exact URL with a copy button. It only answers requests from this computer.',
          'Point your AI tool at that URL with the Streamable HTTP transport, for example claude mcp add tahti --transport http http://127.0.0.1:8800/mcp. It can then play, pause and skip, change the queue, search and play your desktop library and its playlists, tune in to radio, and search Tahti.',
        ],
      },
    ],
  },
  {
    slug: 'governance',
    title: 'Governance for members',
    description:
      'Motions and votes, board discussions, feature requests and correcting the record.',
    productionPath: '/governance',
    sections: [
      {
        heading: 'Motions and votes',
        body: [
          'Open Co-op in the sidebar (/governance). A motion starts as a draft that members second; once it has enough seconds the board opens it for voting.',
          'Read a motion, discuss it in its comments, and vote while it is open. Its page shows who seconded it, the result certificate once it closes, and the meeting it was taken up at.',
        ],
      },
      {
        heading: 'Discussions',
        body: [
          'Governance → Discussions (/governance/discussions) lists topics the board opened for members to talk through. Every member is notified when a topic opens.',
          'Reply to join in; replying follows the topic, so new replies notify you and the list shows how many you have not read. Mute notifications keeps following quietly. You can edit or remove your own reply while the topic is open, and report a reply that should not be there. Long threads open on the latest replies; Show earlier replies loads the rest.',
          'Type @username in a reply to mention a member; they get a notification. The list says who replied last, and Mark all read clears the new-reply counts.',
          'A discussion is not a vote: decisions go through motions.',
        ],
      },
      {
        heading: 'Feature requests',
        body: [
          'Governance → Feature requests is where members suggest and vote on improvements to Tahti. The board reviews them each quarter and publishes what it decided.',
        ],
      },
      {
        heading: 'Correcting the record',
        body: [
          'Something wrong in your member details or a published record? Request a correction on Governance; the board answers there, and you can withdraw the request while it waits.',
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
          'Notifications in the account menu (your avatar, top right) show activity that matters to your account, including likes on your content, new followers, and completed processing jobs. A red dot on your avatar means something is unread; a cyan dot means an unread message.',
          'See all in the notifications quick view opens /notifications: filter by kind (Social, Music, Money, Governance, Other) with unread counts on each chip, mark single notifications read or remove them, or Clear read.',
          'Processing notifications link back to the finished track so you can review its metadata and publishing settings.',
          'The blue light in the top-left navigation is reserved for work still in progress; open it to see the current status.',
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
          'The Admin menu has Overview (Dashboard), Inbox, People (Users, Community), Content, Co-op, and Platform. The Inbox handles support, beta, radio, reports, and feature queues.',
          'Content holds News, Announcements, Tahti Selects, Top lists, Radio, Venues, Artwork presets (the abstract defaults for artwork-free uploads), and Catalog. Platform holds Add-ons, Languages, Vendors, Storage, Streams, the encoding queue, and Diagnostics, which opens Logs and the map.',
          'Co-op holds Governance (with the AGM) and Financial. Disco-widgets manages approved add-ons.',
          'Governance → Annual reports takes a yearly report from draft to approved, published to members and filed with the register; an approved report is corrected (earlier versions are kept), and any report can be put on legal hold.',
          'Governance → Board records board terms (add one, end one early) and runs board elections: call one, edit or cancel it, see and nominate candidates, and record the result, which gives each elected member a board term.',
          'Governance → Records holds members’ correction requests (answer each with a note the member reads), the association’s registered details and auditors, and one list of everything on legal hold.',
          'Governance → AGM keeps each meeting’s agenda as numbered items (add, edit, reorder, remove, and record what was decided), conflicts of interest, legal holds on meetings and documents, document archiving, and a searchable member register.',
          'On a motion’s page the board can circulate a draft for seconds, put the motion on a meeting and one of its agenda items, and append a correction to a closed motion’s result certificate.',
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
    slug: 'studio-notices',
    title: 'Notices about your Studio work',
    description:
      'What Tahti tells you about uploads, renders, exports and distribution, and how to turn it off.',
    productionPath: '/help/studio-notices',
    sections: [
      {
        heading: 'You can leave the page',
        body: [
          'Uploads, editor renders, stem splits, broadcast recordings, exports to Mixcloud and hearthis.at, imports and distribution all run in the background. You can close the page; Notifications in the account menu and /notifications tell you how each one ended.',
          'Finished work links to the track or release. Failed work is marked Failed and says what to do next.',
        ],
      },
      {
        heading: 'What you are told about',
        body: [
          'A new upload is ready, or could not be processed. A replacement version could not be processed.',
          'An editor render or stem split is ready or failed. A broadcast recording was saved as a track or a draft.',
          'A Mixcloud or hearthis.at export finished or failed. A release was sent for distribution, or could not be. A release track matches a recording already in AcoustID.',
          'An import from SoundCloud, Google Drive or hearthis.at failed. An automatic social post did not go out. Your membership ended.',
        ],
      },
      {
        heading: 'Turning them off',
        body: [
          'Settings → Notifications → Studio work has an In-app switch for these notices. Membership and payment notices follow Revenue moves instead.',
        ],
      },
    ],
  },
  {
    slug: 'account-security',
    title: 'Keeping your account safe',
    description:
      'Change your password or email, use two-step sign-in, and know which changes we email you about.',
    productionPath: '/help/account-security',
    sections: [
      {
        heading: 'Password and email',
        body: [
          'Change your password in Settings → Security. You need the current one; every other device is signed out, and any password-reset link sent earlier stops working.',
          'To change your email, enter the new address and your password. We send a link to the new address and nothing changes until it is opened (within 24 hours). Your current address is told straight away, and you can cancel a waiting change in the same place.',
          'Passwords need at least 10 characters, with a lowercase letter, an uppercase letter and a number.',
        ],
      },
      {
        heading: 'Two-step sign-in, devices and tokens',
        body: [
          'Turn on two-step sign-in in Settings → Security, and keep the backup codes somewhere safe.',
          'Settings → Security → Devices lists every signed-in device; sign out one, or all of them.',
          'Settings → Security → API tokens give scripts access to your account. Revoke any you no longer use.',
        ],
      },
      {
        heading: 'Emails we send about your account',
        body: [
          'We email your account address when: your password is changed or reset; your email change is requested, and when it is done (to the old address); two-step sign-in is turned on or off; a device that has not signed in before signs in; a new API token is created; the board suspends or reinstates the account.',
          'If one of these was not you, reset your password straight away and write to support@tahti.live.',
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
          'Your earlier requests are listed with the replies. Mark resolved closes one once you are sorted; replying to a resolved request reopens it.',
        ],
      },
    ],
  },
  {
    slug: 'discover',
    title: 'Discover',
    description:
      'Widgets, the feed, events, parties, artists, groups, and venues in one place.',
    sections: [
      {
        heading: 'The tabs',
        body: [
          'Discover (/discover) has seven tabs: Discover, Feed, Events, Parties, Artists, Groups, and Venues.',
          'The Discover tab is a page of widgets you choose, such as Latest releases, Artist of the week, or Upcoming events. Add widget to Discover adds one; each widget can be moved, configured, or removed. Filter by Genres and Content types.',
          'Feed shows posts from artists you follow, as Stories or as a Calendar.',
          'Artists is the directory with search and filters. Groups are artist collectives with a shared playlist. Venues lists verified venues; Register a venue and My venues are there too.',
        ],
      },
    ],
  },
  {
    slug: 'events-and-parties',
    title: 'Events and listening parties',
    description:
      'Find gigs and live listening parties, comment on events, and join a party.',
    sections: [
      {
        heading: 'Find events',
        body: [
          'Open Discover → Events. Pick a date range, search, or filter by city or venue, and switch between List and Calendar. Past events shows earlier ones.',
          'Post event adds your own event. Artists also manage their events from Studio → Broadcast → Events.',
        ],
      },
      {
        heading: 'An event page',
        body: [
          'The arrows at the top move to the previous or next event, with a counter such as 3 of 12. Back to events returns to the list.',
          'The side panel has Add to Google Calendar, Subscribe (.ics), and Share, and the event’s Comments below them. Sign in to post a comment. Cancelled events have no comments.',
        ],
      },
      {
        heading: 'Listening parties',
        body: [
          'A listening party plays a release for everyone at the same time. Discover → Parties lists live and upcoming ones.',
          'On a party page choose Remind me before it starts, then Join the party. Follow the Tracklist and Party chat, read the liner notes, and choose Leave when you are done. After it ends, Open the release plays it on your own.',
          'Artists start a party from Discover → Parties (Start a party) or Studio → Broadcast → Listening parties.',
        ],
      },
    ],
  },
  {
    slug: 'radio',
    title: 'Tahti Radio',
    description:
      'Listen to community radio, read the schedule, and book a slot.',
    sections: [
      {
        heading: 'Listen',
        body: [
          'Radio (/radio) is 24/7 community radio. Its tabs show Up next, Shows, Just played, and Featured.',
          'A show page lists what is on air, upcoming episodes, and past episodes. Other stations open from the station list on Radio.',
        ],
      },
      {
        heading: 'Schedule and booking',
        body: [
          'The Schedule (/schedule) is a week view; move with Previous week and Next week.',
          'Signed in, you can book a slot from the schedule.',
        ],
      },
    ],
  },
  {
    slug: 'studio-channel',
    title: 'Your channel in Studio',
    description:
      'Design, 24/7 radio, auto-play settings, clips, visibility, and address.',
    sections: [
      {
        heading: 'Channel tabs',
        body: [
          'Studio → Channel has five tabs: Design, Radio, Settings, Visibility, and Address.',
          'Design is the Channel designer: layout, blocks, and colours of your channel page.',
          'Radio is your channel’s 24/7 stream, with Stream and Pinned (messages pinned on the stream).',
          'Visibility sets how fans find your channel and what visitors see. Address holds your channel address and a custom domain.',
        ],
      },
      {
        heading: 'Settings and clips',
        body: [
          'Settings chooses what your channel plays when you are not live: Rotation mode, Auto-add uploads, and Play clips between programs.',
          'Manage clips opens Clips between programs: station IDs, voice links, and announcements played between programme items. Back to Channel settings returns.',
        ],
      },
    ],
  },
  {
    slug: 'artist-profile',
    title: 'Your artist profile',
    description:
      'Identity, links, link page, branding, gallery, and press kit in Studio → Profile.',
    sections: [
      {
        heading: 'Profile tabs',
        body: [
          'Identity starts with your profile header: Change backdrop and Change profile picture. Below are Basics, Story, and People.',
          'Links holds your website, socials, and streaming profiles. Link page builds one page with all your links, ready to share in your bio.',
          'Branding holds your logo (on the avatar, the cover, or both) and Release visuals, the default artwork style for new releases.',
          'Gallery & press kit holds public photos and the press kit promoters download as a ZIP.',
        ],
      },
    ],
  },
  {
    slug: 'settings',
    title: 'Settings',
    description:
      'Account, security, notifications, playback, appearance, and add-ons.',
    sections: [
      {
        heading: 'Settings sections',
        body: [
          'Account: Overview, Membership, Storage, Subs & purchases, and Privacy & data. Your fan subscriptions and purchases are under Subs & purchases.',
          'Security: password and email, two-step sign-in, Devices, and API tokens. Notifications: what you are told about, and Mentions.',
          'Profile appears for accounts without a channel. Artists edit their profile in Studio → Profile.',
        ],
      },
      {
        heading: 'Playback and appearance',
        body: [
          'Playback: volume, shuffle, repeat, volume normalization, skip duration, keep the screen on in full screen, and your radio stations. Its Integrations tab has scrobbling to ListenBrainz and Last.fm.',
          'Appearance: language, Full-screen title change, and themes.',
          'Add-ons lists ready add-ons. About shows what changed in each release.',
        ],
      },
    ],
  },
];

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

const TRANSLATIONS: Record<
  Exclude<ContentLocale, 'en'>,
  Record<string, HelpArticleTranslation>
> = {
  fi: HELP_ARTICLES_FI,
};

function localize(article: HelpArticle, locale: ContentLocale): HelpArticle {
  if (locale === 'en') {
    return article;
  }
  const translation = TRANSLATIONS[locale][article.slug];
  if (!translation) {
    return article;
  }
  return {
    ...article,
    title: translation.title,
    description: translation.description,
    sections: article.sections.map((section, index) => {
      const translated = translation.sections[index];
      return translated
        ? {
            ...section,
            heading: translated.heading,
            body: translated.body,
            table: translated.table ?? section.table,
          }
        : section;
    }),
  };
}

export function getLocalizedHelpArticle(
  slug: string,
  locale: ContentLocale,
): HelpArticle | undefined {
  const article = getHelpArticle(slug);
  return article ? localize(article, locale) : undefined;
}
