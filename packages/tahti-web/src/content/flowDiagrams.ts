// Mermaid journeys for /more (Tahti map).
// Packs: production apps/web vs this Nuclear client (beta.tahti.live) on the same API.
import { MAP_CASE_GROUPS } from './mapScreens';

export type FlowDiagramPack = 'current' | 'nuclear';
export type FlowDiagram = {
  id: string;
  pack: FlowDiagramPack;
  source: string;
  title: string;
  blurb: string;
  mermaid: string;
};

export const FLOW_DIAGRAMS: FlowDiagram[] = [
  {
    id: 'nuclear-content-data-model-2026-09',
    pack: 'nuclear',
    source: '@tahti/shared ARCHIVE_CONTENT_TYPES / COLLECTION_STYLES',
    title:
      'Content data model — sound types, collection styles, where they list',
    blurb:
      'Every SoundContentType a single sound can be, every CollectionStyle a group of sounds can be, which sound types feed which collection styles, and the real surfaces each one shows up on. Kept in sync by hand with packages/shared/src/dto/archive-metadata.ts and collection.ts whenever the taxonomy changes.',
    mermaid: `flowchart TB
  subgraph sounds["Sound content types · SoundContentType"]
    direction TB
    TRACK["TRACK<br/><small>ordinary upload</small>"]
    LIVE["LIVE<br/><small>live recording</small>"]
    DJSET["DJ_SET<br/><small>DJ mix / set</small>"]
    PODCASTS["PODCAST<br/><small>standalone episode-less podcast</small>"]
    REMIX["REMIX"]
    SHOW["SHOW<br/><small>one-off radio show</small>"]
    EPISODE["EPISODE<br/><small>installment of a podcast or show series</small>"]
    CLIP["CLIP<br/><small>short clip / preview / small-scale audio</small>"]
    EMBED["EMBED<br/><small>linked from Mixcloud / Hearthis / Spotify — no hosted audio</small>"]
  end

  subgraph collections["Collection styles · CollectionStyle"]
    direction TB
    ALBUM["ALBUM"]
    EPC["EP"]
    SINGLE["SINGLE"]
    DJSERIES["DJ_SET_SERIES<br/><small>groups DJ_SET tracks</small>"]
    PODCASTC["PODCAST<br/><small>groups EPISODE tracks</small>"]
    RECORDING["RECORDING<br/><small>archived live set — not user-selectable</small>"]
    PLAYLIST["PLAYLIST"]
    SERIESC["SERIES<br/><small>groups a recurring SHOW's EPISODEs</small>"]
  end

  TRACK -.-> ALBUM
  TRACK -.-> EPC
  TRACK -.-> SINGLE
  TRACK -.-> PLAYLIST
  DJSET -.-> DJSERIES
  EPISODE -.-> PODCASTC
  EPISODE -.-> SERIESC
  SHOW -.-> SERIESC
  LIVE -.-> RECORDING

  subgraph surfaces["Where they're listed"]
    direction TB
    Sounds["Studio → Tracks<br/><small>archive / clips folders</small>"]
    Discover["Discover<br/><small>content-type filter chips</small>"]
    Library["Library<br/><small>owned + followed sounds</small>"]
    Radio["Radio · Tahti Radio<br/><small>rotation + submissions</small>"]
    Channel["Channel page<br/><small>archive tab · Elsewhere embeds</small>"]
    CollectionsUI["Studio → Collections / Playlists"]
    Jam["Tahti Jam<br/><small>synced group listening</small>"]
    TrackPage["Track page · /t/:id<br/><small>details · tags · recorded at</small>"]
    TagSearch["Tag search · /search?tag=<br/><small>tracks only</small>"]
    Venue["Venue page · /v/:slug<br/><small>Recorded here</small>"]
    RadioShow["Radio show page · /radio/show/:slug<br/><small>past episodes + recordings</small>"]
  end

  TRACK --> Sounds
  DJSET --> Sounds
  CLIP --> Sounds
  TRACK --> Discover
  LIVE --> Discover
  DJSET --> Discover
  PODCASTS --> Discover
  REMIX --> Discover
  SHOW --> Discover
  EPISODE --> Discover
  CLIP --> Discover
  TRACK --> Library
  SHOW --> Radio
  EPISODE --> Radio
  EMBED --> Channel
  ALBUM --> CollectionsUI
  EPC --> CollectionsUI
  SINGLE --> CollectionsUI
  DJSERIES --> CollectionsUI
  PLAYLIST --> CollectionsUI
  SERIESC --> CollectionsUI
  PODCASTC --> CollectionsUI
  PLAYLIST --> Jam
  TRACK --> TrackPage
  DJSET --> TrackPage
  LIVE --> TrackPage
  TRACK --> TagSearch
  TRACK --> Venue
  LIVE --> Venue
  EPISODE --> RadioShow

  classDef sound fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef coll fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef surface fill:#ecfdf5,stroke:#10b981,color:#065f46;
  class TRACK,LIVE,DJSET,PODCASTS,REMIX,SHOW,EPISODE,CLIP,EMBED sound;
  class ALBUM,EPC,SINGLE,DJSERIES,PODCASTC,RECORDING,PLAYLIST,SERIESC coll;
  class Sounds,Discover,Library,Radio,Channel,CollectionsUI,Jam,TrackPage,TagSearch,Venue,RadioShow surface;
`,
  },
  {
    id: 'nuclear-sitemap-2026',
    pack: 'nuclear',
    source: 'src/router/routes-*.tsx · current beta routes (2026-10-03)',
    title: 'Tahti map - current sitemap',
    blurb:
      'The deployed beta route tree grouped by anonymous, listener, artist, and board access. Redirect-only aliases are in the "Redirects and deep links" graph.',
    mermaid: `flowchart TB
  Home["/ Listen"] --> Public["Public listening"]
  Public --> Radio["/radio"]
  Radio --> RadioShow["/radio/show/$channelSlug · episodes + recordings"]
  Radio --> RadioStation["/radio/station/$stationId"]
  Radio --> Schedule["/schedule · public programme"]
  Public --> Discover["/discover · Artists · Venues tabs"]
  Public --> TagSearch["/search?tag= · tracks by tag"]
  Public --> Favorites["/favorites"]
  Public --> Channel["/channel/$slug · upcoming shows · stage up next"]
  Public --> Artist["/u/$username"]
  Artist --> Collection["/u/$username/c/$slug"]
  Artist --> Subscribe["/subscribe/$username"]
  Artist --> GreenRoom["/u/$username/green-room"]
  Public --> Track["/t/$id · details · tags · recorded at · gate"]
  Public --> Smart["/r/$slug · smart link"]
  Public --> Venue["/v/$slug · Recorded here"]
  Venue --> VenueReg["/venues/register"]
  Public --> Jam["/jam/$code"]
  Public --> Chat["/chat · /chat/$slug"]
  Public --> Info["/help · /help/$slug · /news · /whats-new · /status"]
  Public --> Trust["/transparency/* · /about · /terms · /privacy · /agpl"]
  Public --> StudioGate["/studio · sign-in prompt (StudioGate)"]
  Login["/login · /join · /verify · password reset"] --> Session["Signed in"]
  Session --> Feed["/listen/feed · /feed"]
  Session --> History["/listen/history"]
  Session --> Library["/library · Tracks · Collections · Recordings · Media · Stash · Embeds · Smart links · Local files"]
  Session --> Messages["/messages · /messages/$id"]
  Session --> Onboarding["/onboarding"]
  Session --> Settings["Settings modal · /settings/$section"]
  Settings --> Governance["Account → /governance"]
  Governance --> GovPages["members · meetings/$id · motions/$id · history · feature-requests"]
  StudioGate --> Studio["Signed in + channel → /studio"]
  Studio --> StudioMenu["Overview · Stats · Governance · Posts · Audience · Releases · Editor · Broadcast"]
  Studio --> Broadcast["Broadcast: Go Live · Schedule · Events · Shows · Channel · Radio"]
  Studio --> StudioDetail["sounds/$id · releases/$id · shows/$id · events/$eventId/edit · insights · branding · distribution"]
  Board["Board role"] --> Admin["/admin"]
  Admin --> AdminOverview["Overview: Dashboard · Financial · Storage · Artwork presets · Logs · Status · Vendors"]
  Admin --> AdminCommunity["Community: Moderation · Users · Governance"]
  Admin --> AdminContent["Content: Content · Radio · Tahti Selects · News · Top lists · Announcements"]
  Admin --> AdminManage["Manage: Streams · Venues · Add-ons · Languages · Orphan pages · Map"]
  classDef public fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef session fill:#ecfdf5,stroke:#10b981,color:#065f46;
  classDef artist fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef board fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  class Home,Public,Radio,RadioShow,RadioStation,Schedule,Discover,TagSearch,Favorites,Channel,Artist,Collection,Subscribe,GreenRoom,Track,Smart,Venue,VenueReg,Jam,Chat,Info,Trust,StudioGate public;
  class Login,Session,Feed,History,Library,Messages,Onboarding,Settings,Governance,GovPages session;
  class Studio,StudioMenu,Broadcast,StudioDetail artist;
  class Board,Admin,AdminOverview,AdminCommunity,AdminContent,AdminManage board;
`,
  },
  {
    id: 'nuclear-journey-listener-2026',
    pack: 'nuclear',
    source: 'router.tsx · listener journey',
    title: 'Listener journey — discover to listening',
    blurb:
      'A listener can browse anonymously, open tracks, tags, venues and radio shows, then keep history, favorites, messages, and governance access after signing in.',
    mermaid: `flowchart LR
  Start([Open Tahti]) --> Browse[Listen / Discover / Radio]
  Browse --> Profile[Open artist page or channel]
  Profile --> Play[Play live or archive]
  Play --> Queue[Queue and favorite]
  Play --> TrackPage["Track page /t/:id"]
  TrackPage --> Tag["Tag chip → /search?tag="]
  TrackPage --> Venue["Recorded at → /v/:slug"]
  Venue --> TrackPage
  Tag --> TrackPage
  TrackPage --> Gate{Gated?}
  Gate -->|Fan subscribers only| Subscribe
  Gate -->|Follow or repost to download| Unlock[Unlock the download]
  Browse --> Show["Radio show /radio/show/:slug"]
  Show --> TrackPage
  Profile --> Report[Report to the board]
  Browse --> Join{Sign in?}
  Join -->|No| Anonymous[Continue anonymously]
  Join -->|Yes| Library[Library]
  Library --> Messages[Messages · Artist / Moderator badges]
  Library --> Subscribe[Subscribe to an artist]
  Library --> Governance[Vote and discuss]
  Library --> Jam["Join a Jam /jam/:code"]
  Play --> FavHist[Favorites and history]
  Play --> Chat[Join channel chat]
`,
  },
  {
    id: 'nuclear-navigation-stable-2026-08',
    pack: 'nuclear',
    source:
      'AppShell · StudioNav · AdminNav · LibraryView · settingsNav (2026-10-03)',
    title: 'Current navigation - stable sections',
    blurb:
      'The persistent app shell stays fixed while each section changes only its submenu and page content. Broadcast and Audience have their own nested tab strips; Admin Governance and Moderation fold their old pages into tabs.',
    mermaid: `flowchart TB
  Shell["Persistent app shell"] --> Listener["Listen · Radio · Discover · Favorites"]
  Shell --> Library["Library · signed in"]
  Shell --> HelpSettings["Help center · Settings"]
  Shell --> Studio["Studio"]
  Shell --> Admin["Admin · board role + diagnostics"]

  subgraph libraryTabs["Library tabs"]
    Library --> LibraryMenu["Overview · Tracks · Collections · Recordings · Media · Stash · Embeds · Smart links · Local files"]
  end

  subgraph studio["Studio sections"]
    Studio --> StudioMenu["Studio: Overview · Stats · Governance · Posts · Audience · Releases · Editor · Broadcast"]
    StudioMenu --> BroadcastSub["Broadcast tabs: Go Live · Schedule · Events · Shows · Channel · Radio"]
    StudioMenu --> AudienceSub["Audience tabs: Overview · Tiers · Stripe when configured"]
  end

  subgraph settings["Settings modal sections"]
    HelpSettings --> SettingsMenu["Settings: Account · Artist · Channel and design · Broadcast · Playback · Integrations"]
    HelpSettings --> AppMenu["App: Themes · Add-ons · Logs · What's new"]
  end

  subgraph admin["Admin sections"]
    Admin --> AdminOverview["Overview: Dashboard · Financial · Storage · Artwork presets · Logs · Status · Vendors"]
    Admin --> AdminCommunity["Community: Moderation · Users · Governance"]
    Admin --> AdminContent["Content: Content · Radio · Tahti Selects · News · Top lists · Announcements"]
    Admin --> AdminManage["Manage: Streams · Venues · Add-ons · Languages · Orphan pages · Map"]
    AdminCommunity --> GovTabs["Governance tabs: Overview · Annual reports · Grants · AGM"]
    AdminCommunity --> ModTabs["Moderation tabs: Support · Beta · Radio submissions · Content reports · Feature requests · Missed shows"]
  end

  Studio -.-> Content["Only the page content changes"]
  Admin -.-> Content
  classDef shell fill:#0a0f1e,stroke:#f0a500,color:#e8eaf6;
  classDef studioNode fill:#f3e8ff,stroke:#9333ea,color:#4c1d95;
  classDef adminNode fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  class Shell,Content shell;
  class Studio,StudioMenu,BroadcastSub,AudienceSub studioNode;
  class Admin,AdminOverview,AdminCommunity,AdminContent,AdminManage,GovTabs,ModTabs adminNode;
`,
  },
  {
    id: 'nuclear-journey-artist-admin-2026',
    pack: 'nuclear',
    source: 'router.tsx · Studio and Admin gates',
    title: 'Artist and governing-person journeys',
    blurb:
      'Artists work in Studio; governing people use the board-gated Admin sections while both retain the shared public shell.',
    mermaid: `flowchart TB
  Login["/login"] --> Role{Role}
  Role -->|Artist| Studio["/studio"]
  Studio --> Broadcast["Broadcast: Go Live · Schedule · Events · Shows · Channel · Radio"]
  Studio --> Catalog["Catalog: Releases · Editor · Tracks /studio/sounds · Collections"]
  Library["/library: Tracks · Collections · Recordings · Stash · Upload"] --> Catalog
  Studio --> Grow["Grow: Stats · Governance · Audience (Overview · Tiers · Stripe) · Posts"]
  Studio --> Settings["Settings: Account · Artist · Channel and design · Broadcast"]
  Role -->|Board| Admin["/admin"]
  Admin --> Overview["Overview: needs action and streams"]
  Admin --> Content["Content: catalog and top lists"]
  Admin --> ModerationQueue["Moderation tabs: support · beta · radio submissions · content reports · feature requests · missed shows"]
  Admin --> Logs["Logs: activity and audit"]
  Admin --> Governance["Governance tabs: overview · annual reports · grants · AGM"]
  Admin --> Status["Status: queues · cron · platform"]
`,
  },
  {
    id: 'nuclear-public-pages-2026-10',
    pack: 'nuclear',
    source: 'ArtistView · ChannelView · TrackDetailView · SmartLinkView',
    title: 'Public artist, channel, track and release pages',
    blurb:
      'What a visitor sees and where each public page leads. Report buttons sit on artist, channel, track, collection and smart-link pages and send the report to the board.',
    mermaid: `flowchart TB
  subgraph artist["/u/:username · artist page"]
    A1["Member badge · joined date · nameplate"]
    A2["Pinned release on top · tracks · collections"]
    A3["Liked tracks · when the profile shows them"]
    A4["Tip jar link · fan tier perks"]
    A5["Background music button"]
  end
  subgraph channel["/channel/:slug · channel page"]
    C1["Stage player · time left · up next"]
    C2["Upcoming shows"]
    C3["Member badge · top bar text"]
    C4["Live chat · fan-only room"]
  end
  subgraph track["/t/:id · track page"]
    T1["Details: genre · tempo · key · licence · credits · notes"]
    T2["Tags · recorded at"]
    T3["Like · repost · timed comments"]
    T4["Download, gated or switched off"]
    T5["AI-generated label"]
  end
  subgraph release["/r/:slug · smart link"]
    R1["Release details · genre · credits"]
    R2["Play every release track"]
    R3["Listen on: Spotify · Apple Music · Bandcamp · SoundCloud · YouTube Music · Tidal · Deezer · Amazon Music · Mixcloud"]
    R4["Powered by Tahti footer, when the artist turns it on"]
  end
  artist --> Sub["/subscribe/:username"]
  artist --> channel
  A2 --> release
  A2 --> track
  A3 --> track
  channel --> ChatPage["/chat/:slug"]
  channel --> Sched["/schedule"]
  channel --> Sub
  T2 --> Tag["/search?tag="]
  T2 --> Venue["/v/:slug · Recorded here"]
  T4 --> Sub
  R2 --> track
  release --> artist
  Report["Report to the board"]
  artist -.-> Report
  channel -.-> Report
  track -.-> Report
  release -.-> Report
  classDef page fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef act fill:#fff7ed,stroke:#f97316,color:#7c2d12;
  class Sub,ChatPage,Sched,Tag,Venue page;
  class Report act;
`,
  },
  {
    id: 'nuclear-publishing-2026-10',
    pack: 'nuclear',
    source: 'TrackEditDialog · StudioReleasesView · StudioReleaseDetailView',
    title: 'Artist publishing - track editor and releases to public pages',
    blurb:
      'How track editor fields and release settings in Studio surface on the public track page, tag search, venue page, smart link and artist page.',
    mermaid: `flowchart LR
  subgraph editor["Track editor · /studio/sounds/:id"]
    Basics["Basics: title · content type · genre · tags · release date"]
    Advanced["Advanced: licence · BPM · key · version · AI label · recorded at venue"]
    Sharing["Sharing: comments · rotation · downloads switch · download gate · top lists · Selects"]
    Audio["Audio: normalize · trim · full editor · mastering"]
  end
  subgraph releases["Releases"]
    List["/studio/releases · pin to profile · copy smart link"]
    Detail["/studio/releases/:id"]
    Versions["Versions tab: upload a new audio version"]
    Links["Smart links tab: destinations · playlist · upload audio to a track · Powered by Tahti footer"]
    Stats["Smart link stats: views · clicks"]
    List --> Detail
    Detail --> Versions
    Detail --> Links
    Links --> Stats
  end
  Basics --> TrackPage["/t/:id track page"]
  Advanced --> TrackPage
  Sharing --> TrackPage
  Basics --> TagSearch["/search?tag="]
  Advanced --> Venue["/v/:slug · Recorded here"]
  Audio --> Pro["/studio/sounds/:id/editor · /studio/mastering/:id"]
  Links --> Smart["/r/:slug"]
  List --> Profile["/u/:username · pinned release"]
  List --> Dist["/studio/distribution"]
  classDef studio fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef pub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  class Basics,Advanced,Sharing,Audio,List,Detail,Versions,Links,Stats,Pro,Dist studio;
  class TrackPage,TagSearch,Venue,Smart,Profile pub;
`,
  },
  {
    id: 'nuclear-shows-events-2026-10',
    pack: 'nuclear',
    source:
      'StudioShowsView · StudioShowDetailView · StudioEventsView · RadioShowView · ChannelView',
    title: 'Shows, episodes and events',
    blurb:
      'Recurring shows and one-off events from Studio to the public radio show page, channel page and venue page.',
    mermaid: `flowchart TB
  Shows["/studio/shows"] --> ShowD["/studio/shows/:id"]
  ShowD --> Overview["Overview: title · tagline · artwork · visibility Public / Fans only · auto-publish recordings · episode numbering"]
  ShowD --> Episodes["Episodes tab · new episode from upload or broadcast"]
  ShowD --> Recs["Recordings tab"]
  Episodes --> Review["/studio/shows/episodes/:episodeId · review · trim · approve"]
  Recs --> Review
  Recs --> Snd["/studio/sounds/:id"]
  Review --> GoLive["/studio/go-live"]
  Overview --> GoLive
  Review -.->|approved episode| Public["/radio/show/:slug · past episodes with name · artwork · recording"]
  Public --> Track["/t/:id"]
  Public --> Artist["/u/:username"]
  Public --> Green["/u/:username/green-room"]
  ShowD -.->|channel schedule| Channel["/channel/:slug · Upcoming shows"]
  Events["/studio/events"] --> New["/studio/events/new"]
  Events --> Edit["/studio/events/:eventId/edit"]
  New --> VenueReg["/venues/register"]
  Edit --> VenueReg
  New --> Events
  Edit --> Events
  Venue["/v/:slug · upcoming broadcasts · calendar feed"] --> Track
  classDef studio fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef pub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  class Shows,ShowD,Overview,Episodes,Recs,Review,Snd,GoLive,Events,New,Edit studio;
  class Public,Track,Artist,Green,Channel,VenueReg,Venue pub;
`,
  },
  {
    id: 'nuclear-settings-2026-10',
    pack: 'nuclear',
    source: 'settingsNav · AccountPanel · ArtistPanel · ChannelPanel',
    title: 'Settings modal - sections and their tabs',
    blurb:
      "Settings is a modal with bookmarkable /settings/:section URLs. Signed-out visitors only see Playback, Themes, Add-ons, Logs and What's new. An unknown section opens Account.",
    mermaid: `flowchart TB
  Modal["Settings modal · /settings/:section"] --> Account["account"]
  Modal --> ArtistS["artist"]
  Modal --> ChannelS["channel · Channel and design"]
  Modal --> Bc["broadcast"]
  Modal --> App["playback · integrations · themes · plugin-store · logs · whats-new"]
  Account --> AccTabs["Session · Security · Membership · Governance · Storage · Notifications and visibility · Mentions · Your subs"]
  AccTabs --> Vis["Notifications and visibility: grant report name toggle · show liked tracks · comments default"]
  AccTabs --> Gov["/governance"]
  ArtistS --> ArtTabs["Identity · Story · People · Connections · Branding · Gallery · Press kit · Releases"]
  ArtTabs --> Social["Connections: X and Instagram auto-post"]
  ArtTabs --> Brand["Branding: profile picture incl. GIF · avatar colour · backdrop · logo"]
  Brand -.->|same panel| StudioBrand["/studio/branding"]
  ChannelS --> ChTabs["Channel Designer · Discovery · Username and domain · Moderation"]
  Bc --> BcTabs["Radio · green room · moderators · multistream"]
  Moved["/settings/audience · money · fan-subs · fan-tiers"] -.->|redirect| Audience["/studio/audience"]
  Themes["/themes"] -.->|redirect| App
  classDef sec fill:#ecfdf5,stroke:#10b981,color:#065f46;
  classDef redir fill:#fff7ed,stroke:#f97316,color:#7c2d12;
  class Account,ArtistS,ChannelS,Bc,App sec;
  class Moved,Themes redir;
`,
  },
  {
    id: 'nuclear-redirects-deep-links-2026-10',
    pack: 'nuclear',
    source: 'lib/prodPathRedirects.ts · lib/cutoverReturns.ts · router aliases',
    title: 'Redirects and deep links - old URLs, notifications and returns',
    blurb:
      'Production /dashboard/* paths (bookmarks, emails, notification links) and OAuth / Stripe return parameters resolve to Nuclear routes. Unknown /dashboard paths fall back to /studio.',
    mermaid: `flowchart LR
  subgraph dash["/dashboard/* · DASHBOARD_REDIRECTS"]
    D0["/dashboard (no path)"]
    DMsg["messages · messages/:id"]
    DSnd["archive/:id · sound/:id · archive/:id/editor"]
    DRel["releases/:id · collections/:slug · editor/:id"]
    DIns["stats/detail · insights/:kind/:id"]
    DSet["settings/* · newsletter · posts · revenue"]
    DRadio["settings/distribution"]
    DImp["upload/import/:provider"]
  end
  D0 -->|artist| Studio["/studio"]
  D0 -->|listener| Feed["/feed"]
  DMsg --> Msg["/messages · /messages/:id"]
  DSnd --> Snd["/studio/sounds/:id · /editor"]
  DRel --> Cat["/studio/releases/:id · /studio/collections/:slug · /studio/editor/:id"]
  DIns --> Ins["/studio/stats/detail · /studio/insights/:kind/:id"]
  DSet --> Set["/settings/:section · /studio/updates · /studio/audience"]
  DRadio --> TR["/studio/channel?tab=tahti-radio"]
  DImp --> Imp["/sources/:id → Settings → Add-ons · Import"]
  subgraph returns["Return parameters on /dashboard"]
    Q1["?mixcloud="] --> R1["/settings/plugin-store?category=import"]
    Q2["?fanConnect="] --> R2["/studio/stripe"]
    Q3["?fansubs="] --> R3["/studio/audience"]
    Q4["?membership="] --> R4["/settings/account"]
    Q5["?distribution="] --> R5["/studio/distribution"]
    Q6["?social="] --> R6["/settings/artist?tab=connections"]
  end
  subgraph aliases["Route aliases"]
    AC["/c/:slug"] --> Ch["/channel/:slug"]
    AS["/u/:username/subscribe"] --> Sub["/subscribe/:username"]
    AV["/venues"] --> Disc["/discover?tab=venues"]
    AL["/listen · /listen/favorites · /library/favorites · /history"] --> Home["/ · /favorites · /listen/history"]
    AStu["/studio/archive* · /studio/upload · /studio/stash · /studio/recordings · /studio/playlists"] --> Lib["/studio/sounds* · /library/* · /studio/collections"]
    AAdm["/admin/agm · grants · reports"] --> Gov["/admin/governance/:tab"]
    AMod["/admin/support · beta · radio-submissions · content-reports · feature-requests · missed-shows"] --> Mod["/admin/moderation/:tab"]
  end
  classDef old fill:#fff7ed,stroke:#f97316,color:#7c2d12;
  classDef dest fill:#ecfdf5,stroke:#10b981,color:#065f46;
  class D0,DMsg,DSnd,DRel,DIns,DSet,DRadio,DImp,Q1,Q2,Q3,Q4,Q5,Q6,AC,AS,AV,AL,AStu,AAdm,AMod old;
  class Studio,Feed,Msg,Snd,Cat,Ins,Set,TR,Imp,R1,R2,R3,R4,R5,R6,Ch,Sub,Disc,Home,Lib,Gov,Mod dest;
`,
  },
  {
    id: 'current-README',
    pack: 'current',
    source: 'docs/flows/README.md',
    title: 'Master spine (all personas)',
    blurb:
      'Hosted product (apps/web + @tahti/ui). Same public API as Nuclear. Visual truth: live UI + docs/e2e-screenshots/.',
    mermaid: `flowchart TB
  subgraph entry["1 · Entry"]
    H["/ Home"]
    L["/listen · /radio · /venues"]
    H --> L
  end

  subgraph public["2 · Anonymous listen"]
    C["/c/:slug channel"]
    U["/u/:username profile"]
    R["/r/:slug smart link"]
    L --> C
    L --> U
    U --> C
    U --> S["/u/:username/subscribe"]
    R --> U
  end

  subgraph auth["3 · Account"]
    J["/join · /signup"]
    LI["/login"]
    V["/verify"]
    J --> V
    LI --> D
  end

  subgraph studio["4 · Logged-in surfaces"]
    D["/dashboard"]
    G["/governance"]
    D --> G
  end

  subgraph artist["5 · Artist studio"]
    D --> BC["Broadcast · Schedule"]
    D --> LIB["Music · Upload · Collections · Smart Links"]
    D --> AUD["Newsletter · Revenue · Settings"]
  end

  subgraph board["6 · Board admin"]
    A["/admin/*"]
    D -.-> A
  end

  subgraph api["7 · Public API"]
    Docs["api.tahti.live/api · OpenAPI"]
  end

  entry --> public
  public --> auth
  auth --> studio
  studio --> artist
  studio --> board
  public -.-> Docs
  studio -.-> Docs
`,
  },
  {
    id: 'current-site-map',
    pack: 'current',
    source: 'docs/flows/site-map.md',
    title: 'Site map — every user-facing route',
    blurb:
      'Auth colours: public · session · member · artist · board. Login → /dashboard (or ?next=). Logout → home / login.',
    mermaid: `flowchart TB
  Home["/"]:::pub
  Listen["/listen"]:::pub
  Radio["/radio"]:::pub
  Venues["/venues"]:::pub
  VenuesReg["/venues/register"]:::pub
  How["/how-it-works"]:::pub
  About["/about"]:::pub
  Help["/help…"]:::pub
  Status["/status"]:::pub
  Trans["/transparency"]:::pub
  Method["/transparency/methodology"]:::pub
  Apply["/apply"]:::pub
  Join["/join · /signup"]:::pub
  Login["/login"]:::pub
  Verify["/verify"]:::pub
  Terms["/terms · /privacy · /agpl"]:::pub

  Channel["/c/:slug"]:::pub
  Profile["/u/:username"]:::pub
  Sub["/u/:username/subscribe"]:::pub
  Coll["/u/:username/c/:collection"]:::pub
  Smart["/r/:slug"]:::pub
  EmbedC["/embed/c/:slug"]:::pub
  EmbedR["/embed/r/:id"]:::pub
  EmbedCol["/embed/col/:slug"]:::pub

  Dash["/dashboard"]:::auth
  Msgs["/dashboard/messages"]:::auth
  Gov["/governance"]:::mem

  Stats["/dashboard/stats"]:::art
  Archive["/dashboard/archive · Music"]:::art
  Upload["/dashboard/upload"]:::art
  Colls["/dashboard/collections"]:::art
  Releases["/dashboard/releases · Smart Links"]:::art
  Dist["/dashboard/distribution"]:::art
  Stash["/dashboard/stash"]:::art
  Broadcast["/dashboard/broadcast"]:::art
  Schedule["/dashboard/schedule"]:::art
  VenuesDash["/dashboard/venues"]:::art
  Events["/dashboard/events"]:::art
  RadioSlot["/dashboard/tahti-radio-slots"]:::art
  Posts["/dashboard/posts"]:::art
  Embeds["/dashboard/embeds"]:::art
  News["/dashboard/newsletter/compose"]:::art
  Revenue["/dashboard/revenue"]:::art
  Design["/dashboard/channel/edit"]:::art
  Settings["/dashboard/settings/*"]:::art
  Editor["/dashboard/editor"]:::art

  Admin["/admin/*"]:::board
  ApiDocs["api.tahti.live/api"]:::pub

  Home --> Listen
  Home --> Radio
  Home --> Venues
  Home --> Trans
  Home --> Join
  Home --> Login
  Home --> Channel
  Listen --> Channel
  Radio --> Channel
  Profile --> Channel
  Profile --> Sub
  Profile --> Coll
  Smart --> Profile
  Join --> Verify
  Login --> Dash
  Dash --> Stats
  Dash --> Archive
  Dash --> Upload
  Dash --> Colls
  Dash --> Releases
  Dash --> Broadcast
  Dash --> Schedule
  Dash --> News
  Dash --> Revenue
  Dash --> Design
  Dash --> Settings
  Dash --> Msgs
  Dash --> Gov
  Dash --> Admin
  Gov --> GovVenues
  Admin --> GovVenues
  Home -.-> ApiDocs

  classDef pub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef auth fill:#ecfdf5,stroke:#10b981,color:#065f46;
  classDef mem fill:#fef3c7,stroke:#d97706,color:#92400e;
  classDef art fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef board fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
`,
  },
  {
    id: 'current-sections-full-superseded',
    pack: 'current',
    source: 'Screen atlas (below, per-screenshot cards)',
    title: 'Full action map — superseded by the Screen atlas',
    blurb:
      'The old single "every user option on one canvas" diagram was unreadable at ~90 nodes. Each screenshot card in the Screen atlas below now carries its own small "you can do / go to" diagram plus an accessible text list, generated from the same data so they can\'t drift apart. Scroll to Screen atlas, or jump to a section from here.',
    mermaid: [
      'flowchart LR',
      '  atlas["Screen atlas<br/>(scroll down)"]:::hub',
      ...MAP_CASE_GROUPS.map(
        (group, index) =>
          `  atlas --> g${index}["${group.title}<br/>${group.cases.length} screens"]`,
      ),
      '',
      '  classDef hub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a,font-weight:bold;',
      '',
    ].join('\n'),
  },
  {
    id: 'current-anonymous-listener',
    pack: 'current',
    source: 'docs/flows/anonymous-listener.md',
    title: 'Anonymous listener — navigation',
    blurb: 'No account. Live or archive on /c/:slug + public chat handle.',
    mermaid: `flowchart TD
  A([Land on Tahti]) --> H["/ Home"]
  H --> L["/listen Discover"]
  H --> R["/radio Tahti Radio"]
  H --> V["/venues Calendar"]
  H --> T["/transparency"]
  H --> Help["/help…"]
  H --> Auth["/join or /login"]

  L --> C["/c/:slug Channel"]
  R --> C
  H --> C
  H --> P["/u/:username Profile"]
  P --> C
  P --> S["/u/:username/subscribe"]
  P --> Coll["/u/:username/c/:collection"]
  Smart["/r/:slug Smart link"] --> P
  Smart --> C

  C --> Play{Live?}
  Play -->|Yes| Live[Play HLS live + public chat]
  Play -->|No| Arch[Archive / rotation playback]
  Live --> Chat[Join chat with anonymous handle]
  Arch --> Chat

  S --> Gate{Want fan perks?}
  Gate -->|Yes| Auth
  Gate -->|Browse only| S

  EmbedC["/embed/c/:slug"] -.-> C
  EmbedR["/embed/r/:id"] -.-> Smart
`,
  },
  {
    id: 'current-logged-in-listener',
    pack: 'current',
    source: 'docs/flows/logged-in-listener.md',
    title: 'Logged-in listener / member — navigation',
    blurb:
      'Free listener · €40 coop member · optional channel → artist studio.',
    mermaid: `flowchart TD
  A([Anonymous]) --> Join["/join or /signup"]
  Join --> Verify["/verify email"]
  Verify --> Login["/login"]
  A --> Login

  Login --> Dash["/dashboard"]
  Dash --> Free{Membership?}

  Free -->|None · free listener| FreeDash[Listener dashboard]
  Free -->|€40 member| MemDash[Member dashboard]
  Free -->|Also has channel| Artist[Part 3 · Artist studio]

  FreeDash --> Sub["/u/:artist/subscribe → Stripe"]
  MemDash --> Gov["/governance"]
  Gov --> Motions[Browse / vote motions]
  Gov --> VenuesMem[Member venue views]

  Sub --> FanChat[Fan chat on /c/:slug when perk allows]
  FreeDash --> Msgs["/dashboard/messages"]
  MemDash --> Msgs
  FreeDash --> Account["/dashboard/settings/account"]
`,
  },
  {
    id: 'current-artist',
    pack: 'current',
    source: 'docs/flows/artist.md',
    title: 'Artist — navigation',
    blurb: 'Studio sidebar groups match packages/ui dashboard-nav.',
    mermaid: `flowchart TD
  Login["/login"] --> Dash["/dashboard Channel overview"]
  Dash --> Setup["/dashboard/setup-channel if no channel"]

  subgraph sidebar["Studio sidebar"]
    direction TB
    Dash
    Stats["Stats"]
    subgraph lib["My Library"]
      Music["Music · archive"]
      Upload["Upload"]
      Colls["Collections"]
      Links["Smart Links · releases"]
      Dist["Distribution · More"]
      Stash["Stash · More"]
    end
    subgraph bc["Broadcasting"]
      Broadcast["Broadcast"]
      Schedule["Schedule"]
      Venues["Venues · More"]
      Events["Events · More"]
      RadioSlot["Radio slot · More"]
      Posts["Posts · More"]
      Embeds["Embeds · More"]
    end
    subgraph aud["Audience"]
      Newsletter["Newsletter"]
      Revenue["Revenue"]
    end
    subgraph setupG["Channel setup"]
      Design["Design"]
      Settings["Settings → subnav"]
    end
  end

  Dash --> Stats
  Dash --> lib
  Dash --> bc
  Dash --> aud
  Dash --> setupG

  Broadcast --> Live["Go live · OBS keys · browser studio"]
  Music --> ArchItem["Archive item · editor"]
  Upload --> Import["Import Bandcamp / SC / Drive / URL"]
  Links --> RelDetail["Release detail"]
  Colls --> CollEdit["Collection editor"]
  Settings --> SetTabs["Account · Artist info · Fan subs · …"]

  Dash -.-> Pub["Public /c/:slug · /u/:username"]
`,
  },
  {
    id: 'current-board-member',
    pack: 'current',
    source: 'docs/flows/board-member.md',
    title: 'Board member — navigation',
    blurb: 'User.isBoard → /admin/* on apps/web only (not rebuilt in Nuclear).',
    mermaid: `flowchart TD
  Login["/login as board"] --> Studio["/dashboard"]
  Studio --> Admin["/admin → /admin/dashboard"]

  subgraph nav["Admin sidebar"]
    Dash["Dashboard"]
    Beta["Beta"]
    Users["Users"]
    Radio["Radio"]
    RadioSub["Radio submissions"]
    News["News"]
    Selects["Selects"]
    Streams["Streams"]
    Support["Support"]
    Top["Top lists"]
    Ann["Announcements"]
    Storage["Storage"]
    Files["Files"]
    Reports["Reports"]
    Fin["Financial"]
    Gov["Governance"]
    Feat["Features"]
    Grants["Grants"]
    AGM["AGM"]
    Vendors["Vendors"]
    Status["Status"]
  end

  Admin --> Dash
  Dash --> Beta
  Dash --> Users
  Dash --> Streams
  Dash --> Support
  Fin --> Ledger["/admin/financial/ledger"]
  Fin --> FanSubs["/admin/financial/fansubs"]
  Fin --> Legacy["/admin/financial/legacy-members"]
  Gov --> Audit["/admin/logs · audit events"]
  Gov --> Res["/admin/governance · board resolutions"]
  Gov --> Report["/admin/reports · annual reports"]
  Gov --> Venues["/admin/venues · venue verification"]
  Grants --> GrantYear["/admin/grants/:year"]
`,
  },
  {
    id: 'current-navigation-flows-design-review',
    pack: 'current',
    source: 'docs/flows/navigation-flows-design-review.md',
    title: '1. Master spine (all four parts)',
    blurb: 'Full colour route map: docs/flows/site-map.md.',
    mermaid: `flowchart TB
  subgraph p1["Part 1 · Anonymous listener"]
    H[Home / Listen / Radio] --> C[Channel play + public chat]
    C --> P[Profile · smart link · collection]
  end

  subgraph p2["Part 2 · Logged-in listener / member"]
    A[Join · verify · login] --> D[Dashboard]
    D --> F[Fan subscribe]
    D --> G[Governance if member]
  end

  subgraph p3["Part 3 · Artist"]
    S[Studio sidebar] --> Lib[My Library]
    S --> Bc[Broadcasting]
    S --> Aud[Audience + Settings]
    Lib --> Pub[Public channel / profile]
    Bc --> Pub
  end

  subgraph p4["Part 4 · Board"]
    Ad[Admin sidebar] --> Ops[Users · Streams · Support]
    Ad --> Money[Financial · Grants]
    Ad --> Org[Governance · AGM]
  end

  p1 --> p2
  p2 --> p3
  p3 --> p4
`,
  },
  {
    id: 'nuclear-README',
    pack: 'nuclear',
    source: 'router.tsx + AppShell',
    title: 'Master spine (Nuclear shell)',
    blurb:
      'beta.tahti.live - Nuclear chrome on the same Tahti API. Sparse sidebar · main · queue rail · player bar. Chat and notifications are top-bar controls; channel chat opens at /chat/:slug.',
    mermaid: `flowchart TB
  subgraph shell["Nuclear shell"]
    SB[Sparse sidebar]
    MAIN[Main]
    RR[Right rail · Queue only]
    PB[Player bar]
  end

  subgraph listen["Listen"]
    L["/ Listen directory"]
    Feed["/listen/feed"]
    R["/radio"]
    D["/discover"]
    C["/channel/:slug"]
    U["/u/:username"]
    LF["/favorites"]
    LH["/listen/history"]
    T["/t/:id"]
    TS["/search?tag="]
  end

  subgraph library["Library · own sidebar item"]
    LIB["/library · Tracks · Collections · Recordings · Media · Stash · Embeds · Smart links · Local files"]
  end

  subgraph studio["Studio routes"]
    ST["/studio"]
    GL["/studio/go-live · Broadcast tabs"]
    CAT["Releases · Editor · /studio/sounds · /studio/collections · /library/upload"]
    Gov["/studio/governance"]
  end

  subgraph settings["Settings modal"]
    SET["Account · Artist · Channel and design · Broadcast · Playback · Integrations · Themes · Add-ons · Logs · What's new"]
    Foot["Footer: GitHub · Discord · API docs · no About"]
  end

  SB --> L
  SB --> R
  SB --> D
  SB --> LF
  SB --> LIB
  SB --> ST
  SB --> Help["/help"]
  SB --> SET
  L --> Feed
  L --> LF
  L --> LH
  L --> C
  C --> RR
  C --> PB
  C --> CH["/chat/:slug"]
  U --> T
  T --> TS
  TS --> T
  ST --> GL
  ST --> CAT
  ST --> LIB
  ST --> Gov
  SET --> Foot
  U -->|owner| Design[Profile Design tab]
`,
  },
  {
    id: 'nuclear-site-map',
    pack: 'nuclear',
    source: 'router.tsx',
    title: 'Site map — Nuclear tahti-web',
    blurb:
      'Current beta routes, playback surfaces, and artist/admin workspaces. Use the diagram zoom controls for dense route groups.',
    mermaid: `flowchart TB
  Entry["beta.tahti.live"]:::pub --> Listen["Listen · / · /listen"]:::pub
  Listen --> Radio["Radio · /radio"]:::pub
  Radio --> Show["Radio show · /radio/show/:slug · episodes"]:::pub
  Listen --> Discover["Discover · /discover · artists · venues"]:::pub
  Listen --> Fav["Favorites · /favorites"]:::pub
  Listen --> Channel["Channel · /c/:slug → /channel/:slug"]:::pub
  Listen --> Profile["Artist · /u/:username"]:::pub
  Listen --> Feed["Feed · /listen/feed"]:::auth
  Listen --> Hist["History · /listen/history"]:::auth
  Channel --> Playback["Player · visualizer · queue · up next"]:::pub
  Channel --> Chat["Chat · /chat/:slug"]:::pub
  Channel --> Upcoming["Upcoming shows"]:::pub
  Profile --> Sub["Fan subscription · /subscribe/:user"]:::auth
  Profile --> Coll["Collections · /u/:user/c/:slug"]:::pub
  Profile --> Smart["Smart links · /r/:slug"]:::pub
  Profile --> Track["Track page · /t/:id"]:::pub
  Track --> Tag["Tag search · /search?tag="]:::pub
  Track --> Venue["Venue · /v/:slug"]:::pub
  Listen --> Library["Library · tracks · collections · recordings · stash · smart links"]:::auth
  Listen --> DMs["Messages · /messages"]:::auth
  Listen --> Settings["Settings modal · no About footer"]:::auth
  Settings --> AccountGov["Account → /governance"]:::auth
  Settings --> Sources["Add-ons · Import"]:::auth
  Listen --> Studio["Studio · overview · catalog · broadcast"]:::studio
  Studio --> GoLive["Broadcast · Go live · schedule · events · shows · channel · radio"]:::studio
  Studio --> Music["Catalog · sounds · releases · collections · /library/upload · editor"]:::studio
  Studio --> Publish["Studio · governance · posts · audience · stripe · stats"]:::studio
  Listen --> Public["Transparency · help · news · legal · embeds · /jam/:code"]:::pub
  Listen --> Admin["Board admin · in-app /admin/*"]:::board
  Admin --> Map["Tahti map · /admin/map (also /more)"]:::review
  Map --> Shots["Annotated Tahti ↔ Nuclear screenshots"]:::review
  Map --> Flows["Mermaid journeys and route map"]:::review

  classDef pub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef auth fill:#ecfdf5,stroke:#10b981,color:#065f46;
  classDef studio fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef board fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  classDef review fill:#fff7ed,stroke:#f97316,color:#7c2d12;
`,
  },
  {
    id: 'nuclear-anonymous-listener',
    pack: 'nuclear',
    source: 'Listen / Channel / Radio / Discover / Studio',
    title: 'Anonymous listener — navigation',
    blurb:
      'Listen hub is /. Sidebar surfaces Discover, Favorites, and Studio to anonymous visitors too - Studio shows a sign-in prompt (StudioGate) instead of bouncing to Settings. /venues now redirects to the Discover Venues tab.',
    mermaid: `flowchart TD
  A([Open beta.tahti.live]) --> L["/ Listen"]
  L --> R["/radio"]
  L --> D["/discover"]
  L --> Fav["/favorites"]
  L --> Feed["/listen/feed"]
  L --> Hist["/listen/history"]
  L --> St["/studio · StudioGate sign-in prompt"]
  L --> C["/channel/:slug"]
  L --> U["/u/:username"]
  L --> Help["/help"]
  Help --> Keys["/help/keyboard-shortcuts"]
  R --> C
  R --> Show["/radio/show/:slug · past episodes"]
  Show --> U
  Show --> T
  U --> C
  U --> S["/subscribe/:username"]
  U --> Coll["/u/:user/c/:slug"]
  U --> T["/t/:id track page"]
  Smart["/r/:slug"] --> U
  Smart --> T
  T --> Tag["/search?tag="]
  Tag --> T
  T --> V["/v/:slug venue"]
  V --> T
  D --> V
  T --> S

  C --> ChatPage["/chat/:slug live chat"]
  C --> PB[Player bar · seek on VOD]
  C --> Up[Upcoming shows · stage up next]

  L --> Auth["/join · /login"]
  Venues["/venues"] -.->|redirect| D
  L --> Trans["/transparency"]
  L --> Legal["/about · /terms · /privacy via Help"]
`,
  },
  {
    id: 'nuclear-logged-in-listener',
    pack: 'nuclear',
    source: 'Library / Governance / Settings',
    title: 'Logged-in listener / member — navigation',
    blurb:
      'Library tabs replace dashboard listener chrome; Favorites/History are Listen pages, not Library; themes under Settings. Account → Notifications carries the profile visibility switches, including liked tracks.',
    mermaid: `flowchart TD
  Auth["/join · /login · TOTP"] --> Onb["/onboarding · first sign-in"]
  Onb --> L["/ Listen"]
  Auth --> L
  L --> Lib["/library · tabs + subscribed collections"]
  L --> Feed["/listen/feed"]
  L --> Fav["/favorites · liked tracks"]
  L --> Hist["/listen/history"]
  L --> Sub["/subscribe/:artist"]
  L --> Acc["Settings → Account"]
  Acc --> Gov["/governance · member"]
  Acc --> Notif["Notifications tab · show liked tracks on profile"]
  L --> DM["/messages · Artist / Moderator badges"]
  DM --> Thread["/messages/:id"]
  L --> Jam["/jam/:code · guest control when the host allows"]
  L --> Help["/help · my support requests"]
  Acc --> Themes[Settings → Themes]
  Acc --> Addons[Settings → Add-ons]
  Sub --> Stripe[Stripe checkout URL]
`,
  },
  {
    id: 'nuclear-artist',
    pack: 'nuclear',
    source: '/studio/*',
    title: 'Artist — navigation',
    blurb:
      'StudioNav: Overview · Stats · Governance · Posts · Audience · Releases · Editor · Broadcast, with Broadcast tabs for Go Live · Schedule · Events · Shows · Channel · Radio. Tracks, collections and upload are reached from Studio home and Library. Import lives in Settings → Add-ons.',
    mermaid: `flowchart TD
  Login["/login"] --> Studio["/studio"]
  Studio --> Setup["/studio/channel?tab=setup if needed"]

  Studio --> St["/studio/stats"]
  Studio --> Gov["/studio/governance"]
  Studio --> Upd["/studio/updates · edit · schedule"]
  Studio --> Rev["/studio/audience"]
  Studio --> Rel["/studio/releases · pin to profile"]
  Rel --> RelD["/studio/releases/:id · versions · smart links · credits"]
  Studio --> Ed["/studio/editor"]
  Studio --> Arch["/studio/sounds"]
  Arch --> Snd["/studio/sounds/:id · track editor"]
  Studio --> Coll["/studio/collections"]
  Studio --> Up["/library/upload"]
  Up --> Snd
  Studio --> Lib["/library"]
  Studio --> Brand["/studio/branding · avatar colour · GIF picture"]

  Studio --> GL["/studio/go-live"]
  Studio --> Sch["/studio/schedule"]
  Studio --> Ev["/studio/events"]
  Ev --> EvNew["/studio/events/new"]
  Ev --> EvEdit["/studio/events/:eventId/edit"]
  Studio --> Shows["/studio/shows"]
  Shows --> ShowD["/studio/shows/:id · visibility · numbering"]
  ShowD --> Ep["/studio/shows/episodes/:episodeId"]
  Studio --> Ch["/studio/channel"]
  Studio --> Radio["/studio/channel?tab=radio"]

  Studio --> Settings["Settings modal"]
  Settings --> Addons["Add-ons · Import"]

  GL --> Live["LIVE → player bar + /channel/:slug"]
  Snd --> Ed
`,
  },
  {
    id: 'nuclear-artist-1',
    pack: 'nuclear',
    source: '/studio/go-live',
    title: 'Artist — Go Live path',
    blurb:
      'OBS / Icecast keys (or the server OBS scene collection) → signal check with the weekly live-time meter → go live → multistream.',
    mermaid: `flowchart LR
  A[Studio → Broadcast → Go Live] --> B[Copy OBS / Icecast keys]
  A --> B2[Download OBS scene collection + recommended settings]
  B --> C[Signal check]
  B2 --> C
  C --> M[Weekly live-time meter]
  C --> D[Go Live]
  D --> E[Player bar · open channel]
  D --> F["Multistream · /studio/channel?tab=multicast"]
  D --> G["Recordings · /library/recordings"]
`,
  },
  {
    id: 'nuclear-board-member',
    pack: 'nuclear',
    source: 'FEATURES.md',
    title: 'Board member — in-app Admin',
    blurb:
      'Board users stay in Nuclear AdminNav. Governance (with Annual reports, Grants and AGM tabs) is a Community item, distinct from member /governance and Studio Governance. Old admin URLs redirect into these tabs.',
    mermaid: `flowchart TD
  Shell[Nuclear sidebar] --> Admin["/admin"]
  Admin --> Overview[Dashboard · Financial · Storage · Artwork presets · Logs · Status · Vendors]
  Admin --> Community[Moderation · Users · Governance]
  Admin --> Content[Content · Radio · Tahti Selects · News · Top lists · Announcements]
  Admin --> Manage[Streams · Venues · Add-ons · Languages · Orphan pages · Map]
  Community --> Gov["/admin/governance/:tab · overview · reports · grants · agm"]
  Gov --> GrantYear["/admin/grants/:year"]
  Community --> Mod["/admin/moderation/:tab · support · beta · radio-submissions · content-reports · feature-requests · missed-shows"]
  Overview --> StorageUser["/admin/storage/:userId"]
  Manage --> Orphans["/admin/orphan-pages/:tab · radio station suggestions"]
`,
  },
  {
    id: 'nuclear-navigation-flows-design-review',
    pack: 'nuclear',
    source: 'Tahti map',
    title: '1. Spine',
    blurb: 'Three product surfaces: apps/web · Nuclear · public API docs.',
    mermaid: `flowchart TB
  subgraph p1["Part 1 · Anonymous"]
    L[Listen] --> C[Channel]
    C --> PB[Player bar]
    C --> RR[Right rail · Queue]
    C --> Chat["/chat/:slug"]
  end
  subgraph p2["Part 2 · Member"]
    A[Auth] --> Lib[Library]
    A --> Gov[Governance]
    A --> Set[Settings]
  end
  subgraph p3["Part 3 · Artist"]
    St[Studio routes] --> GL[Broadcast · Go Live]
    St --> Cat[Catalog · Releases · Editor]
    Src[Settings → Add-ons · Import] --> Cat
    Prof[Studio Branding · Settings → Artist] --> St
    Cat --> PubPages[Public track · smart link · artist page]
  end
  subgraph api["Public API"]
    Docs[api.tahti.live/api]
  end
  p1 --> p2
  p2 --> p3
  p1 -.-> Docs
`,
  },
  {
    id: 'current-cases-anonymous',
    pack: 'current',
    source: 'cases-anonymous',
    title: 'Cases — anonymous listen',
    blurb:
      'Home, radio online, channel live vs offline, chat join, profile, subscribe gate, smart link, embed.',
    mermaid: `flowchart TD
  H["/listen Home"] --> R["/radio online"]
  H --> C["/c/:slug"]
  R --> C
  C --> Live{Live?}
  Live -->|Yes| L[HLS live + LIVE badge]
  Live -->|No| A[Archive / rotation VOD]
  L --> Chat[Chat join anonymous handle]
  A --> Chat
  H --> P["/u/:username"]
  P --> Sub["/u/:user/subscribe gate"]
  Sub --> Auth["/join or /login"]
  Smart["/r/:slug"] --> P
  Emb["/embed/c/:slug"] -.-> C
`,
  },
  {
    id: 'current-cases-auth',
    pack: 'current',
    source: 'cases-auth',
    title: 'Cases — auth',
    blurb: 'Join, verify token, login, optional TOTP.',
    mermaid: `flowchart LR
  J["/join"] --> V["/verify token"]
  V --> LI["/login"]
  LI --> TOTP{TOTP enabled?}
  TOTP -->|Yes| Code[Enter TOTP]
  TOTP -->|No| Sess[Session cookie]
  Code --> Sess
  Sess --> Next["?next= or /dashboard"]
`,
  },
  {
    id: 'current-cases-listener',
    pack: 'current',
    source: 'cases-listener',
    title: 'Cases — listener / member',
    blurb: 'Library, fan checkout, DMs, governance vote vs forbidden.',
    mermaid: `flowchart TD
  Login --> Dash["/dashboard"]
  Dash --> Lib[Follows / history]
  Dash --> Sub["Subscribe → Stripe"]
  Dash --> DM["/dashboard/messages"]
  Dash --> Mem{€40 member?}
  Mem -->|Yes| Gov["/governance vote"]
  Mem -->|No| Gate[Governance forbidden / upsell]
`,
  },
  {
    id: 'current-cases-artist',
    pack: 'current',
    source: 'cases-artist',
    title: 'Cases — artist studio',
    blurb:
      'Home, go-live steps, upload, stash, collections, stats, sources, revenue, channel design.',
    mermaid: `flowchart TD
  Dash["/dashboard"] --> Setup{Has channel?}
  Setup -->|No| SC[Setup channel wizard]
  Setup -->|Yes| Home[Studio home]
  Home --> GL["Broadcast: keys → signal → go live"]
  Home --> Up[Upload prepare PUT complete]
  Home --> Arch[Archive / Music]
  Home --> Stash[Stash private]
  Home --> Coll[Collections designer]
  Home --> Stats[Stats + detail]
  Home --> Src[Sources OAuth import]
  Home --> Rev[Revenue Connect]
  Home --> Design[Channel design]
`,
  },
  {
    id: 'current-cases-edge',
    pack: 'current',
    source: 'cases-edge',
    title: 'Cases — edge / gates',
    blurb: 'Payments not ready, studio logged out, radio offline badge.',
    mermaid: `flowchart TD
  Pay[Revenue / subscribe] --> Conn{Connect ready?}
  Conn -->|No| Block[Payments not ready]
  Conn -->|Yes| Stripe[Checkout / payouts]
  Studio["/dashboard"] --> Auth{Logged in?}
  Auth -->|No| Login["/login"]
  Radio["/radio"] --> On{Icecast up?}
  On -->|No| Badge[Offline badge]
  On -->|Yes| HLS[Play stream]
`,
  },
  {
    id: 'nuclear-cases-anonymous',
    pack: 'nuclear',
    source: 'cases-anonymous',
    title: 'Cases — anonymous listen',
    blurb:
      'Listen hub, radio HLS, channel live vs archive, /chat/:slug, subscribe, track page gates, tag and venue browsing, report, embed.',
    mermaid: `flowchart TD
  L["/ Listen"] --> R["/radio always-on HLS"]
  L --> C["/channel/:slug"]
  R --> C
  C --> Live{Live?}
  Live -->|Yes| PB[Player bar live]
  Live -->|No| Arch["Archive / 24/7 rotation · time left + up next"]
  C --> ChatPage["/chat/:slug"]
  ChatPage --> Join[Chat join handle]
  C --> Rail[Right rail Queue]
  L --> U["/u/:username"]
  U --> Sub["/subscribe/:user gate"]
  U --> Tip[Tip jar link · fan tier perks]
  Smart["/r/:slug · DSP links"] --> U
  U --> T["/t/:id"]
  T --> Gate{Track gated?}
  Gate -->|Fan subscribers only| Sub
  Gate -->|Download gate| Unlock[Follow or repost to unlock]
  Gate -->|Open| Details[Details · tags · recorded at]
  Details --> Tag["/search?tag="]
  Details --> V["/v/:slug · Recorded here"]
  C --> Report[Report to the board]
  T --> Report
  U --> Report
  Emb["/embed/*"] -.-> C
`,
  },
  {
    id: 'nuclear-cases-auth',
    pack: 'nuclear',
    source: 'cases-auth',
    title: 'Cases — auth',
    blurb: 'Join, verify, login, TOTP — session cookie on beta host.',
    mermaid: `flowchart LR
  J["/join"] --> V["/verify"]
  V --> LI["/login"]
  LI --> TOTP{TOTP?}
  TOTP -->|Yes| Code[TOTP step]
  TOTP -->|No| Cookie["session on beta host"]
  Code --> Cookie
  Cookie --> L["/ Listen"]
`,
  },
  {
    id: 'nuclear-cases-listener',
    pack: 'nuclear',
    source: 'cases-listener',
    title: 'Cases — listener / member',
    blurb:
      'Library tabs, subscribe checkout, DMs with role badges, Jam guest control, governance member vs gated.',
    mermaid: `flowchart TD
  Auth --> Lib["/library"]
  Auth --> Feed["/listen/feed"]
  Auth --> LF["/favorites · /listen/history"]
  Auth --> Sub["/subscribe/:artist → Stripe"]
  Auth --> DM["/messages · Artist / Moderator badges"]
  Auth --> Jam["/jam/:code"]
  Jam --> Ctl{Host gave control?}
  Ctl -->|Yes| Drive[Guest plays / pauses for everyone]
  Ctl -->|No| Follow[Guest follows the host]
  Auth --> Acc["Settings → Account"]
  Acc --> Mem{Member?}
  Mem -->|Yes| Gov["/governance vote"]
  Mem -->|No| Gate[Governance gated]
`,
  },
  {
    id: 'nuclear-cases-artist',
    pack: 'nuclear',
    source: 'cases-artist',
    title: 'Cases — artist studio',
    blurb:
      'Studio routes: Go Live, upload, tracks, releases, collections, shows, events, posts, stats, Audience, Stripe, channel.',
    mermaid: `flowchart TD
  ST["/studio"] --> Gate{Login + channel?}
  Gate -->|No| LoginOrSetup[Login or setup]
  Gate -->|Yes| Home[Studio home]
  Home --> GL["/studio/go-live"]
  Home --> Up["/library/upload"]
  Up --> Snd["/studio/sounds/:id"]
  Home --> Arch["/studio/sounds"]
  Arch --> Snd
  Snd --> Edit["Track editor · Basics tags · Advanced recorded at · Sharing downloads"]
  Home --> Rel["/studio/releases"]
  Rel --> RelD["/studio/releases/:id · upload track audio · new version"]
  Home --> Coll["/studio/collections"]
  Home --> Shows["/studio/shows/:id"]
  Home --> Posts["/studio/updates · schedule a post"]
  Home --> Stats["/studio/stats"]
  Home --> Rev["/studio/audience"]
  Home --> Stripe["/studio/stripe"]
  Home --> Ch["/studio/channel"]
  Home --> Addons["Settings → Add-ons → Import"]
`,
  },
  {
    id: 'nuclear-cases-edge',
    pack: 'nuclear',
    source: 'cases-edge',
    title: 'Cases — edge / gates',
    blurb:
      'Payments not ready, studio logged out, radio HLS vs offline, gated tracks, old prod links, and chat switched off.',
    mermaid: `flowchart TD
  Rev["/studio/audience"] --> StripeOn{Stripe enabled?}
  StripeOn -->|Yes| Dash["/studio/stripe"]
  StripeOn -->|No| Stay[Audience only]
  Dash --> Conn{Connect ready?}
  Conn -->|No| Block[Payments not ready]
  ST["/studio"] --> Auth{Logged in?}
  Auth -->|No| Login["/login"]
  Radio["/radio"] --> HLS[Player bar HLS when feed exists]
  T["/t/:id"] --> Access{Access mode}
  Access -->|Fan subscribers only| FanGate["Fan-only state → /subscribe/:user"]
  Access -->|Purchase| Buy[Buy to listen]
  Access -->|Downloads off| NoDl[No download button]
  Old["/dashboard/* · notification and email links"] --> Map["DASHBOARD_REDIRECTS → Nuclear route"]
  Map -->|unknown path| Fallback["/studio"]
  Chat["Channel chat"] --> Off{Chat off or error?}
  Off -->|Yes| Notice[Plain-words notice instead of the composer]
`,
  },
];

export const FLOW_PACKS: {
  id: FlowDiagramPack;
  label: string;
  hint: string;
}[] = [
  {
    id: 'current',
    label: 'apps/web',
    hint: 'Canonical hosted product · docs/flows + e2e screenshots',
  },
  {
    id: 'nuclear',
    label: 'Nuclear',
    hint: 'beta.tahti.live · same API · this client',
  },
];
