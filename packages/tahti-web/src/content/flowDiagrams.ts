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
  GovVenues["/governance/venues"]:::board

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
    id: 'current-sections-full',
    pack: 'current',
    source:
      'tahti-fit/flows/current/site-map.md + dashboard/admin route inventory',
    title: 'Full action map — every user option, Listener · Artist · Admin',
    blurb:
      'Every page broken down to the actual things a user can DO there, not just section names — deliberately large. Leave a note on any page, section, or action below; export as CSV; if you request changes here, give me the exported CSV and I will regenerate this diagram to match.',
    mermaid: `flowchart TB
  subgraph LISTENER["Listener surfaces"]
    subgraph pListen["/listen"]
      lSearch[Search channels]
      lGenre[Filter by genre chip]
      lPreview[Preview-play a channel card]
      lOpen[Open channel]
    end
    subgraph pChannel["/c/:slug"]
      cPlayLive[Play live stream]
      cPlayArchive[Play an archive track]
      cQueue[Add track to queue]
      cHeart[Heart / favorite channel]
      cReport[Report channel]
      cChatRead[Read chat]
      cChatPost[Post a chat message]
      cChatReact[React in chat]
      cChatJoin[Set nickname / join chat]
      cArchiveList[Browse archive tracklist]
      cArchiveFilter[Filter / sort archive]
      cSubscribe[Subscribe — fan tier CTA]
    end
    subgraph pRadio["/radio"]
      rDayTab[Switch schedule day tab]
      rNow[View now playing]
      rRecent[View recently played]
      rPlay[Play radio stream]
    end
    subgraph pProfile["/u/:username"]
      pBio[Read bio + socials]
      pFollow[Follow artist]
      pReleases[Browse albums / singles]
      pSets[Browse DJ sets / live shows]
      pPlay[Play / queue / heart any track]
      pSubscribe[Subscribe — fan tiers]
      pReport[Report profile]
      pFeed[Read artist feed posts]
    end
    subgraph pCollection["/u/:username/c/:slug"]
      colTracklist[Browse tracklist]
      colPlayAll[Play whole collection]
      colPlayOne[Play one track]
    end
    subgraph pSmart["/r/:slug"]
      smClick[Click through to a DSP]
    end
    subgraph pVenues["/venues"]
      vDirectory[Browse venue directory]
      vRegister[Register a venue]
    end
    subgraph pGov["/governance"]
      govMotions[Read motions]
      govVote[Cast a vote]
      govFeat[Submit a feature request]
      govComment[Comment on a motion]
    end
  end

  subgraph ARTIST["Artist studio (/dashboard/*)"]
    subgraph pOverview["Studio home"]
      ovStats[View stats summary]
      ovGoLive[Go Live shortcut]
      ovQuick[Jump to Music / Broadcast]
    end
    subgraph pBroadcast["Broadcast"]
      bc1a[Copy RTMP URL + stream key]
      bc1b[Regenerate stream key]
      bc1c[Pick fallback rotation source]
      bc2a[Preview HLS test signal]
      bc2b[Watch signal meters]
      bc3a[Preview full-quality stream]
      bc3b[Open green room]
      bc3c[Toggle auto-record]
      bc3d[Toggle auto-publish]
      bc4a[Watch audio-check levels-ready panel]
      bc4b[Go live]
      bc1a --> bc2a --> bc3a --> bc4a
    end
    subgraph pMusicStudio["Music / Archive"]
      muSearch[Search / sort track list]
      muPlay[Play a track]
      muEdit[Open track editor]
      muMorePin[More menu: pin to Stage]
      muMoreRotation[More menu: add to 24/7 rotation]
      muMorePlaylist[More menu: add to playlist]
      muMoreInsights[More menu: view insights]
      muMoreDelete[More menu: delete]
      muEdBasics[Editor tab: Basics — title/artist/genre]
      muEdTracklist[Editor tab: Tracklist — timestamps]
      muEdVisuals[Editor tab: Visuals — cover + preset]
      muEdSharing[Editor tab: Sharing — license/embed]
      muEdAdvanced[Editor tab: Advanced — venue/credits/BPM/key]
    end
    subgraph pUpload["Upload"]
      upPick[Pick or drag-drop a file]
      upProgress[Watch upload + processing progress]
      upOpen[Open in Music when done]
    end
    subgraph pCollections["Collections"]
      colCreate[Create a collection]
      colReorder[Reorder tracks]
      colCover[Set collection cover]
      colVisibility[Set visibility]
      colDelete[Delete collection]
    end
    subgraph pReleases["Releases"]
      relCreate[Create a release]
      relAddTracks[Add tracks]
      relSmart[Set smart-link targets]
      relDist[View distribution status]
      relPublish[Publish]
    end
    subgraph pSchedule["Schedule"]
      schBook[Book a Tahti Radio slot]
      schCancel[Cancel a booking]
    end
    subgraph pStats["Stats"]
      stOverview[View plays over time]
      stRange[Filter by date range]
      stPeak[View listener peak]
      stDetail[Drill into one track's detail]
    end
    subgraph pChannelDesign["Channel designer"]
      chVisual[Pick visual preset]
      chAccent[Pick brand accent]
      chHeader[Pick header style]
      chGallery[Configure gallery / slideshow]
      chPreview[Preview live]
    end
    subgraph pRevenue["Revenue"]
      revTiers[View fan tiers]
      revEditTier[Edit tier pricing]
      revStripe[Connect Stripe]
      revPayouts[View payouts]
    end
    subgraph pStash["Stash"]
      stashUpload[Upload to stash — cloud-import staging]
      stashPromote[Promote a stash file into Music]
    end
    subgraph pSettings["Settings"]
      setAccount[Edit account]
      setArtist[Edit artist profile — bio/socials/avatar]
      setMoney[Configure fan tiers]
      setConnections[Manage social / DSP connections]
    end
  end

  subgraph ADMIN["Admin (/admin/*)"]
    aDash[Dashboard — system health, queue depth, audit log]
    aBeta[Beta applications — approve / reject]
    aUsers[Users — search, view, suspend]
    aRadio[Radio — manage curated rotation, feature a track]
    aRadioSub[Radio submissions — review, approve / reject]
    aNews[News — compose + publish a post]
    aSelects[Tahti Selects — manage CC0 catalog, run weekly draw]
    aStreams[Streams — view live streams, force-end]
    aSupport[Support — respond to + close tickets]
    aTop[Top lists — view top artists / tracks]
    aAnnounce[Announcements — upload + schedule a clip]
    aStorage[Storage — usage by bucket, growth trend]
    aFiles[Files — browse, delete orphaned files]
    aReports[Content reports — review, resolve / dismiss]
    aFinancial[Financial — ledger, export report]
    aGov[Governance hub — manage motions, tally votes]
    aFeat[Feature requests — triage, mark planned]
    aGrants[Grants — record + view disbursements]
    aAGM[AGM — manage resolutions]
    aVendors[Vendors — manage vendor list]
    aStatus[Status — uptime, edit an incident]
    aI18n[Languages / i18n — create language, import CSV]
  end

  LISTENER -.-> ARTIST
  ARTIST -.-> ADMIN

  classDef sec fill:#f8fafc,stroke:#94a3b8,color:#334155;
  class lSearch,lGenre,lPreview,lOpen,cPlayLive,cPlayArchive,cQueue,cHeart,cReport,cChatRead,cChatPost,cChatReact,cChatJoin,cArchiveList,cArchiveFilter,cSubscribe,rDayTab,rNow,rRecent,rPlay,pBio,pFollow,pReleases,pSets,pPlay,pSubscribe,pReport,pFeed,colTracklist,colPlayAll,colPlayOne,smClick,vDirectory,vRegister,govMotions,govVote,govFeat,govComment,ovStats,ovGoLive,ovQuick,bc1a,bc1b,bc1c,bc2a,bc2b,bc3a,bc3b,bc3c,bc3d,bc4a,bc4b,muSearch,muPlay,muEdit,muMorePin,muMoreRotation,muMorePlaylist,muMoreInsights,muMoreDelete,muEdBasics,muEdTracklist,muEdVisuals,muEdSharing,muEdAdvanced,upPick,upProgress,upOpen,colCreate,colReorder,colCover,colVisibility,colDelete,relCreate,relAddTracks,relSmart,relDist,relPublish,schBook,schCancel,stOverview,stRange,stPeak,stDetail,chVisual,chAccent,chHeader,chGallery,chPreview,revTiers,revEditTier,revStripe,revPayouts,stashUpload,stashPromote,setAccount,setArtist,setMoney,setConnections sec;
  classDef admin fill:#fef2f2,stroke:#ef4444,color:#7f1d1d;
  class aDash,aBeta,aUsers,aRadio,aRadioSub,aNews,aSelects,aStreams,aSupport,aTop,aAnnounce,aStorage,aFiles,aReports,aFinancial,aGov,aFeat,aGrants,aAGM,aVendors,aStatus,aI18n admin;
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
  Gov --> Audit["/admin/governance/audit"]
  Gov --> Res["/admin/governance/resolutions"]
  Gov --> Report["/admin/governance/report"]
  Gov --> Venues["/governance/venues verification"]
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
    R["/radio"]
    C["/channel/:slug"]
    U["/u/:username"]
  end

  subgraph library["My Library"]
    LIB["/library · Favorites · History · Messages"]
  end

  subgraph studio["Studio routes"]
    ST["/studio"]
    GL["/studio/go-live"]
    CAT["Archive · Releases · Collections · Upload · …"]
  end

  subgraph moreHub["More hub"]
    MORE["/more · Tahti map"]
    SRC["/sources"]
    SET["/settings · Themes"]
  end

  SB --> L
  SB --> R
  SB --> LIB
  SB --> ST
  SB --> MORE
  L --> C
  C --> RR
  C --> PB
  ST --> GL
  ST --> CAT
  MORE --> SRC
  MORE --> SET
  U -->|owner| Design[Profile Design tab]
`,
  },
  {
    id: 'nuclear-site-map',
    pack: 'nuclear',
    source: 'router.tsx',
    title: 'Site map — Nuclear tahti-web',
    blurb:
      'Current beta routes, production aliases, playback surfaces, and artist/admin workspaces. The review-only map is gated from production builds.',
    mermaid: `flowchart TB
  Entry["app.tahti.live"]:::pub --> Listen["Listen · / · /listen"]:::pub
  Listen --> Radio["Radio · /radio"]:::pub
  Listen --> Channel["Channel · /c/:slug → /channel/:slug"]:::pub
  Listen --> Profile["Artist · /u/:username"]:::pub
  Listen --> Feed["Feed · /feed"]:::auth
  Channel --> Playback["Player · visualizer · queue"]:::pub
  Channel --> Chat["Chat · rail or /chat/:slug"]:::pub
  Profile --> Sub["Fan subscription · /u/:user/subscribe"]:::auth
  Profile --> Coll["Collections · /u/:user/c/:slug"]:::pub
  Profile --> Smart["Smart links · /r/:slug"]:::pub
  Listen --> Library["Library · favorites · history · messages"]:::auth
  Listen --> Settings["Settings · account · artist · money · connections"]:::auth
  Settings --> Sources["Sources · imports and exports"]:::auth
  Listen --> Studio["Studio · /dashboard/* → /studio/*"]:::studio
  Studio --> GoLive["Go Live · rotation · controls · bitrate"]:::studio
  Studio --> Music["Music · metadata · artwork · playlists · export"]:::studio
  Studio --> Programme["24/7 programme · schedule · shows"]:::studio
  Studio --> Publish["Releases · collections · updates · distribution"]:::studio
  Studio --> Business["Stats · revenue · stash · moderation"]:::studio
  Listen --> Public["Venues · transparency · help · legal · embeds"]:::pub
  Listen --> Admin["Board admin · /admin/*"]:::board
  Admin -.-> Legacy["Next admin remains production canonical"]:::board
  Admin --> Map["Beta review map · /more"]:::review
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
    source: 'Listen / Channel / Radio',
    title: 'Anonymous listener — navigation',
    blurb: 'Listen hub is /. Chat + queue live in the right rail / player bar.',
    mermaid: `flowchart TD
  A([Open beta.tahti.live]) --> L["/ Listen"]
  L --> R["/radio"]
  L --> C["/channel/:slug"]
  L --> U["/u/:username"]
  R --> C
  U --> C
  U --> S["/subscribe/:username"]
  U --> Coll["/u/:user/c/:slug"]
  Smart["/r/:slug"] --> U

  C --> Rail[Right rail Chat]
  C --> PB[Player bar · seek on VOD]

  L --> More["/more · help · legal · map"]
  L --> Auth["/join · /login"]
  L --> Venues["/venues"]
  L --> Trans["/transparency"]
`,
  },
  {
    id: 'nuclear-logged-in-listener',
    pack: 'nuclear',
    source: 'Library / Governance / Settings',
    title: 'Logged-in listener / member — navigation',
    blurb:
      'Library tabs replace dashboard listener chrome; themes under Settings.',
    mermaid: `flowchart TD
  Auth["/join · /login · TOTP"] --> L["/ Listen"]
  L --> Lib["/library · Favorites · History · Messages"]
  L --> Sub["/subscribe/:artist"]
  L --> Gov["/governance · if member"]
  L --> Acc["/settings · Account"]
  Lib --> Fav[Favorites]
  Lib --> Hist[History]
  Lib --> DM[Messages]
  Acc --> Themes[Settings → Themes]
  Sub --> Stripe[Stripe checkout URL]
`,
  },
  {
    id: 'nuclear-artist',
    pack: 'nuclear',
    source: '/studio/*',
    title: 'Artist — navigation',
    blurb:
      'Studio is route-based (not only in-page tabs). Sources is a sibling hub.',
    mermaid: `flowchart TD
  Login["/login"] --> Studio["/studio"]
  Studio --> Setup["/studio/channel?tab=setup if needed"]

  Studio --> GL["/studio/go-live"]
  Studio --> Arch["/studio/archive"]
  Studio --> Rel["/studio/releases"]
  Studio --> Coll["/studio/collections"]
  Studio --> Up["/studio/upload"]
  Studio --> Ed["/studio/editor"]
  Studio --> Stash["/studio/stash"]
  Studio --> Sch["/studio/schedule"]
  Studio --> St["/studio/stats"]
  Studio --> Ch["/studio/channel"]
  Studio --> Shows["/studio/shows"]
  Studio --> Pl["/studio/playlists"]
  Studio --> Upd["/studio/updates"]
  Studio --> Rev["/studio/revenue"]
  Studio --> Dist["/studio/distribution"]
  Studio --> Src["/sources"]

  Profile["/u/:me"] -->|owner| Design[Design tab]
  Studio --> Settings["/settings"]

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
    title: 'Board member — link-out',
    blurb:
      'Admin console is Tahti-only; Nuclear links out to production /admin.',
    mermaid: `flowchart TD
  POC[Nuclear tahti-web] -->|link-out| Admin["apps/web /admin/*"]
  Admin --> Users[Users · Streams · Support]
  Admin --> Money[Financial · Grants]
  Admin --> Org[Governance · AGM]
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
  Auth --> Lib["/library Favorites History"]
  Auth --> Sub["/subscribe/:artist → Stripe"]
  Auth --> DM["/messages"]
  Auth --> Mem{Member?}
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
      'Studio routes: Go Live, upload, stash, collections, stats, sources, revenue, design.',
    mermaid: `flowchart TD
  ST["/studio"] --> Gate{Login + channel?}
  Gate -->|No| LoginOrSetup[Login or setup]
  Gate -->|Yes| Home[Studio home]
  Home --> GL["/studio/go-live"]
  Home --> Up["/studio/upload"]
  Home --> Arch["/studio/archive"]
  Home --> Stash["/studio/stash"]
  Home --> Coll["/studio/collections"]
  Home --> Stats["/studio/stats"]
  Home --> Rev["/studio/revenue"]
  Home --> Ch["/studio/channel"]
  Home --> Src["/sources"]
`,
  },
  {
    id: 'nuclear-cases-edge',
    pack: 'nuclear',
    source: 'cases-edge',
    title: 'Cases — edge / gates',
    blurb: 'Payments not ready, studio logged out, radio HLS vs offline.',
    mermaid: `flowchart TD
  Rev["/studio/revenue"] --> Conn{Connect ready?}
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
