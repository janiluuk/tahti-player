// Mermaid journeys for /more (Tahti map).
// Packs: production apps/web vs this Nuclear client (beta.tahti.live) on the same API.
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
      'Every ArchiveContentType a single sound can be, every CollectionStyle a group of sounds can be, which sound types feed which collection styles, and the real surfaces each one shows up on. Kept in sync by hand with packages/shared/src/dto/archive-metadata.ts and collection.ts whenever the taxonomy changes.',
    mermaid: `flowchart TB
  subgraph sounds["Sound content types · ArchiveContentType"]
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
    Sounds["Studio → Sounds<br/><small>archive / clips folders</small>"]
    Discover["Discover<br/><small>content-type filter chips</small>"]
    Library["Library<br/><small>owned + followed sounds</small>"]
    Radio["Radio · Tahti Radio<br/><small>rotation + submissions</small>"]
    Channel["Channel page<br/><small>archive tab · Elsewhere embeds</small>"]
    CollectionsUI["Studio → Collections / Playlists"]
    Jam["Tahti Jam<br/><small>synced group listening</small>"]
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

  classDef sound fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef coll fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef surface fill:#ecfdf5,stroke:#10b981,color:#065f46;
  class TRACK,LIVE,DJSET,PODCASTS,REMIX,SHOW,EPISODE,CLIP,EMBED sound;
  class ALBUM,EPC,SINGLE,DJSERIES,PODCASTC,RECORDING,PLAYLIST,SERIESC coll;
  class Sounds,Discover,Library,Radio,Channel,CollectionsUI,Jam surface;
`,
  },
  {
    id: 'nuclear-sitemap-2026',
    pack: 'nuclear',
    source: 'router.tsx · current beta routes',
    title: 'Tahti map — current sitemap',
    blurb:
      'The deployed beta route tree grouped by anonymous, listener, artist, and board access.',
    mermaid: `flowchart TB
  Home["/ Listen"] --> Public["Public listening"]
  Public --> Radio["/radio"]
  Public --> Discover["/discover"]
  Public --> Feed["/listen/feed"]
  Public --> Favorites["/favorites"]
  Public --> History["/listen/history"]
  Public --> Channel["/channel/$slug"]
  Public --> Artist["/u/$username"]
  Artist --> Collection["/u/$username/c/$slug"]
  Artist --> Subscribe["/subscribe/$username"]
  Public --> Help["/help · /help/keyboard-shortcuts"]
  Public --> Legal["/about · /terms · /privacy · Help hub"]
  Public --> StudioGate["/studio · sign-in prompt (StudioGate)"]
  Login["/login · /join"] --> Library["/library"]
  Library --> Collections["/library/collections"]
  Login --> Messages["/messages"]
  Settings["Settings modal"] --> Account["Account"]
  Account --> Governance["/governance · member"]
  Governance --> GovernanceHistory["/governance/history · public closed motions"]
  StudioGate --> Studio["Signed in + channel → /studio"]
  Studio --> StudioMenu["Overview · Branding · Stats · Governance · Posts · Audience · Library · Sounds · Collections · Releases · Upload · Editor"]
  Studio --> Perform["Go Live · Broadcast · Events · Shows · Channel · Radio"]
  Settings --> SettingsAddons["Themes · Add-ons · no About footer"]
  Board["Board role"] --> Admin["/admin"]
  Admin --> AdminOverview["Overview · Financial · Storage · Artwork · Logs · Status · Vendors"]
  Admin --> AdminCommunity["Moderation · Users · Governance · Reports · Grants · AGM"]
  Admin --> AdminContent["Content · Radio · Selects · News · Top lists · Announcements"]
  Admin --> AdminManage["Streams · Venues · Disco widgets · Languages · Orphan pages · Map"]
  classDef public fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a;
  classDef session fill:#ecfdf5,stroke:#10b981,color:#065f46;
  classDef artist fill:#f3e8ff,stroke:#9333ea,color:#6b21a8;
  classDef board fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  class Home,Public,Radio,Discover,Feed,Favorites,Channel,Artist,Collection,Subscribe,Help,Legal,StudioGate public;
  class Login,Library,History,Collections,Messages,Governance,Settings,Account session;
  class GovernanceHistory public;
  class Studio,StudioMenu,Perform,SettingsAddons artist;
  class Board,Admin,AdminOverview,AdminCommunity,AdminContent,AdminManage board;
`,
  },
  {
    id: 'nuclear-journey-listener-2026',
    pack: 'nuclear',
    source: 'router.tsx · listener journey',
    title: 'Listener journey — discover to listening',
    blurb:
      'A listener can browse anonymously, then keep history, favorites, messages, and governance access after signing in.',
    mermaid: `flowchart LR
  Start([Open Tahti]) --> Browse[Listen / Discover / Radio]
  Browse --> Profile[Open artist channel]
  Profile --> Play[Play live or archive]
  Play --> Queue[Queue and favorite]
  Browse --> Join{Sign in?}
  Join -->|No| Anonymous[Continue anonymously]
  Join -->|Yes| Library[Library]
  Library --> Messages[Messages and notifications]
  Library --> Subscribe[Subscribe to an artist]
  Library --> Governance[Vote and discuss]
  Play --> FavHist[Favorites and history]
  Play --> Chat[Join channel chat]
`,
  },
  {
    id: 'nuclear-navigation-stable-2026-08',
    pack: 'nuclear',
    source: 'StudioNav · AdminNav · current beta routes',
    title: 'Current navigation — stable sections',
    blurb:
      'The persistent app shell stays fixed while each section changes only its submenu and page content.',
    mermaid: `flowchart TB
  Shell["Persistent app shell"] --> Listener["Listen · Radio · Discover · Favorites"]
  Shell --> HelpSettings["Help · Settings"]
  Shell --> Studio["Studio"]
  Shell --> Admin["Admin · board role"]

  subgraph studio["Studio sections"]
    Studio --> StudioOverview["Studio: Overview · Branding · Stats · Governance · Posts · Audience · Library · Sounds · Collections · Releases · Upload · Editor"]
    Studio --> Perform["Perform: Go Live · Broadcast · Events · Shows · Channel · Radio"]
  end

  subgraph admin["Admin sections"]
    Admin --> AdminOverview["Overview: Dashboard · Financial · Storage · Artwork presets · Logs · Status · Vendors"]
    Admin --> AdminCommunity["Community: Moderation · Users · Governance · Annual reports · Grants · AGM"]
    Admin --> AdminContent["Content: Content · Radio · Tahti Selects · News · Top lists · Announcements"]
    Admin --> AdminManage["Manage: Streams · Venues · Disco widgets · Languages · Orphan pages · Map"]
  end

  Studio -.-> Content["Only the page content changes"]
  Admin -.-> Content
  classDef shell fill:#0a0f1e,stroke:#f0a500,color:#e8eaf6;
  classDef studioNode fill:#f3e8ff,stroke:#9333ea,color:#4c1d95;
  classDef adminNode fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  class Shell,Content shell;
  class Studio,StudioOverview,Perform studioNode;
  class Admin,AdminOverview,AdminCommunity,AdminContent,AdminManage adminNode;
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
  Studio --> Perform["Perform: Go Live · Broadcast · Shows · Channel · Radio"]
  Studio --> Library["Library: Sounds · Upload · Collections"]
  Studio --> Grow["Grow: Stats · Governance · Audience (Overview · Tiers · Stripe) · Posts"]
  Studio --> Settings["Settings: artist and account · broadcast sources"]
  Role -->|Board| Admin["/admin"]
  Admin --> Overview["Overview: needs action and streams"]
  Admin --> Content["Content: catalog and top lists"]
  Admin --> ModerationQueue["Moderation: support · reports · missed shows"]
  Admin --> Logs["Logs: activity and audit"]
  Admin --> Governance["Governance and AGM"]
  Admin --> Status["Status: queues · cron · platform"]
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
    mermaid: `flowchart LR
  atlas["Screen atlas<br/>(scroll down)"]:::hub
  atlas --> listener["Listener surfaces<br/>13 screens"]
  atlas --> artist["Artist studio<br/>19 screens"]
  atlas --> auth["Auth<br/>4 screens"]
  atlas --> edge["Edge / gate cases<br/>4 screens"]

  classDef hub fill:#eef4ff,stroke:#3b82f6,color:#1e3a8a,font-weight:bold;
`,
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
      'beta.tahti.live — Nuclear chrome on the same Tahti API. Sparse sidebar · main · Chat rail · player bar.',
    mermaid: `flowchart TB
  subgraph shell["Nuclear shell"]
    SB[Sparse sidebar]
    MAIN[Main]
    RR[Right rail · Chat / Queue]
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
  end

  subgraph library["Library · Studio tab"]
    LIB["/library · sounds · collections"]
  end

  subgraph studio["Studio routes"]
    ST["/studio"]
    GL["/studio/go-live"]
    CAT["Sounds · Releases · Collections · Upload · …"]
    Gov["/studio/governance"]
  end

  subgraph settings["Settings modal"]
    SET["Account · Artist · Channel · Broadcast · Themes · Add-ons · What's new"]
    Foot["Footer: GitHub · Discord · API docs · no About"]
  end

  SB --> L
  SB --> R
  SB --> D
  SB --> LF
  SB --> ST
  SB --> Help["/help"]
  SB --> SET
  L --> Feed
  L --> LF
  L --> LH
  L --> C
  C --> RR
  C --> PB
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
  Listen --> Discover["Discover · /discover"]:::pub
  Listen --> Fav["Favorites · /favorites"]:::pub
  Listen --> Channel["Channel · /c/:slug → /channel/:slug"]:::pub
  Listen --> Profile["Artist · /u/:username"]:::pub
  Listen --> Feed["Feed · /listen/feed"]:::auth
  Listen --> Hist["History · /listen/history"]:::auth
  Channel --> Playback["Player · visualizer · queue"]:::pub
  Channel --> Chat["Chat · rail or /chat/:slug"]:::pub
  Profile --> Sub["Fan subscription · /u/:user/subscribe"]:::auth
  Profile --> Coll["Collections · /u/:user/c/:slug"]:::pub
  Profile --> Smart["Smart links · /r/:slug"]:::pub
  Listen --> Library["Library · sounds · collections · releases"]:::auth
  Listen --> Settings["Settings modal · no About footer"]:::auth
  Settings --> AccountGov["Account → /governance"]:::auth
  Settings --> Sources["Add-ons · Import"]:::auth
  Listen --> Studio["Studio · overview · library · perform"]:::studio
  Studio --> GoLive["Perform · Go live · schedule · shows · events · channel · radio"]:::studio
  Studio --> Music["Library · sounds · releases · collections · upload · editor"]:::studio
  Studio --> Publish["Studio · governance · posts · audience · stripe · stats"]:::studio
  Listen --> Public["Venues · transparency · help · legal · embeds"]:::pub
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
      'Listen hub is /. Sidebar now surfaces Discover, Favorites, and Studio to anonymous visitors too — Studio shows a sign-in prompt (StudioGate) instead of bouncing to Settings.',
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
  U --> C
  U --> S["/subscribe/:username"]
  U --> Coll["/u/:user/c/:slug"]
  Smart["/r/:slug"] --> U

  C --> Rail[Right rail Chat]
  C --> PB[Player bar · seek on VOD]

  L --> Auth["/join · /login"]
  L --> Venues["/venues · no chrome item"]
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
      'Library tabs replace dashboard listener chrome; Favorites/History are Listen tabs, not Library; themes under Settings.',
    mermaid: `flowchart TD
  Auth["/join · /login · TOTP"] --> L["/ Listen"]
  L --> Lib["/library"]
  L --> Feed["/listen/feed"]
  L --> Fav["/favorites"]
  L --> Hist["/listen/history"]
  L --> Sub["/subscribe/:artist"]
  L --> Acc["Settings → Account"]
  Acc --> Gov["/governance · member"]
  L --> DM["/messages"]
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
      'StudioNav: Studio (catalog + manage) and Perform (go live / broadcast). Import lives in Settings → Add-ons.',
    mermaid: `flowchart TD
  Login["/login"] --> Studio["/studio"]
  Studio --> Setup["/studio/channel?tab=setup if needed"]

  Studio --> Brand["/studio/branding"]
  Studio --> St["/studio/stats"]
  Studio --> Gov["/studio/governance"]
  Studio --> Upd["/studio/updates"]
  Studio --> Rev["/studio/audience"]
  Studio --> Lib["/library"]
  Studio --> Arch["/library/sounds"]
  Studio --> Rel["/studio/releases"]
  Studio --> Coll["/library/collections"]
  Studio --> Up["/library/upload"]
  Studio --> Ed["/studio/editor"]

  Studio --> GL["/studio/go-live"]
  Studio --> Sch["/studio/schedule"]
  Studio --> Ev["/studio/events"]
  Studio --> Shows["/studio/shows"]
  Studio --> Ch["/studio/channel"]
  Studio --> Radio["/studio/channel?tab=radio"]

  Studio --> Settings["Settings modal"]
  Settings --> Addons["Add-ons · Import"]

  GL --> Live["LIVE → player bar + /channel/:slug"]
  Arch --> Ed
`,
  },
  {
    id: 'nuclear-artist-1',
    pack: 'nuclear',
    source: '/studio/go-live',
    title: 'Artist — Go Live path',
    blurb: 'OBS / Icecast keys → signal check → go live → multistream.',
    mermaid: `flowchart LR
  A[Studio → Go Live] --> B[Copy OBS / Icecast]
  B --> C[Signal check]
  C --> D[Go Live]
  D --> E[Player bar · open channel]
  D --> F[Multistream tab]
`,
  },
  {
    id: 'nuclear-board-member',
    pack: 'nuclear',
    source: 'FEATURES.md',
    title: 'Board member — in-app Admin',
    blurb:
      'Board users stay in Nuclear AdminNav. Governance and AGM are Community items, distinct from member /governance and Studio Governance.',
    mermaid: `flowchart TD
  Shell[Nuclear sidebar] --> Admin["/admin"]
  Admin --> Overview[Dashboard · Financial · Storage · Artwork · Logs · Status · Vendors]
  Admin --> Community[Moderation · Users · Governance · Reports · Grants · AGM]
  Admin --> Content[Content · Radio · Selects · News · Top lists · Announcements]
  Admin --> Manage[Streams · Venues · Disco widgets · Languages · Orphan pages · Map]
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
    C --> RR[Right · Queue / Chat]
  end
  subgraph p2["Part 2 · Member"]
    A[Auth] --> Lib[Library]
    A --> Gov[Governance]
    A --> Set[Settings]
  end
  subgraph p3["Part 3 · Artist"]
    St[Studio routes] --> GL[Go Live]
    St --> Cat[Catalog · Editor]
    Src[Sources] --> Cat
    Prof[Profile Design] --> St
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
      'Listen hub, radio HLS, channel live vs archive, chat rail, subscribe, embed.',
    mermaid: `flowchart TD
  L["/ Listen"] --> R["/radio always-on HLS"]
  L --> C["/channel/:slug"]
  R --> C
  C --> Live{Live?}
  Live -->|Yes| PB[Player bar live]
  Live -->|No| Arch[Archive library + seek]
  C --> Rail[Right rail Queue / Chat]
  Rail --> Join[Chat join handle]
  L --> U["/u/:username"]
  U --> Sub["/subscribe/:user gate"]
  Smart["/r/:slug"] --> U
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
    blurb: 'Library tabs, subscribe checkout, DMs, governance member vs gated.',
    mermaid: `flowchart TD
  Auth --> Lib["/library"]
  Auth --> Feed["/listen/feed"]
  Auth --> LF["/favorites · /listen/history"]
  Auth --> Sub["/subscribe/:artist → Stripe"]
  Auth --> DM["/messages"]
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
      'Studio routes: Go Live, upload, stash, collections, stats, Audience, Stripe, design.',
    mermaid: `flowchart TD
  ST["/studio"] --> Gate{Login + channel?}
  Gate -->|No| LoginOrSetup[Login or setup]
  Gate -->|Yes| Home[Studio home]
  Home --> GL["/studio/go-live"]
  Home --> Up["/studio/upload"]
  Home --> Arch["/studio/sounds"]
  Home --> Stash["/library/stash"]
  Home --> Coll["/studio/collections"]
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
    blurb: 'Payments not ready, studio logged out, radio HLS vs offline.',
    mermaid: `flowchart TD
  Rev["/studio/audience"] --> StripeOn{Stripe enabled?}
  StripeOn -->|Yes| Dash["/studio/stripe"]
  StripeOn -->|No| Stay[Audience only]
  Dash --> Conn{Connect ready?}
  Conn -->|No| Block[Payments not ready]
  ST["/studio"] --> Auth{Logged in?}
  Auth -->|No| Login["/login"]
  Radio["/radio"] --> HLS[Player bar HLS when feed exists]
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
