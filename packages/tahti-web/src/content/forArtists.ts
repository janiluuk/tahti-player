import type { ContentLocale } from '../lib/contentLocale';

export type ForArtistsPillarId =
  'live' | 'publish' | 'program' | 'design' | 'earn' | 'grow';

export type ForArtistsCopy = {
  title: string;
  subtitle: string;
  backLabel: string;
  heroEyebrow: string;
  heroHeading: string;
  heroBody: string;
  startCta: string;
  guideCta: string;
  pillarsEyebrow: string;
  pillarsTitle: string;
  pillars: Record<
    ForArtistsPillarId,
    { title: string; lead: string; points: string[] }
  >;
  stepsEyebrow: string;
  stepsTitle: string;
  steps: Array<{ title: string; body: string }>;
  anywhereEyebrow: string;
  anywhereTitle: string;
  anywhere: { apps: AnywhereItem; cli: AnywhereItem };
  communityEyebrow: string;
  communityTitle: string;
  communityBody: string;
  community: { vote: AnywhereItem; open: AnywhereItem; source: AnywhereItem };
  closingTitle: string;
  closingBody: string;
};

type AnywhereItem = { title: string; body: string };

export const FOR_ARTISTS_COPY: Record<ContentLocale, ForArtistsCopy> = {
  en: {
    title: 'Tahti for artists',
    subtitle: 'Your channel, your music, your income.',
    backLabel: 'What is Tahti',
    heroEyebrow: 'For independent artists',
    heroHeading:
      'Go live, publish your music and earn directly from your fans.',
    heroBody:
      'Tahti is a Finnish nonprofit broadcasting platform owned by its members. You run your own channel. Your listeners tune in without ads or tracking. The community runs the platform together.',
    startCta: 'Start your channel',
    guideCta: 'Read the artist guide',
    pillarsEyebrow: 'Everything in one studio',
    pillarsTitle: 'Six things your channel does for you.',
    pillars: {
      live: {
        title: 'Go live',
        lead: 'Broadcast from the software you already use.',
        points: [
          'Stream from OBS, Mixxx or Traktor with the RTMP or Icecast details from your studio.',
          'Send the same show to other platforms at the same time.',
          'Invite guests into a green room before you go on air.',
        ],
      },
      publish: {
        title: 'Publish',
        lead: 'Your releases, credited properly.',
        points: [
          'Upload tracks and archive sets.',
          'Build releases and albums with full credits.',
          'Share them with smart links and embeds.',
        ],
      },
      program: {
        title: 'Program your channel',
        lead: 'On air even when you are not.',
        points: [
          'Schedule your shows ahead of time.',
          'Keep a 24/7 rotation running while you are offline.',
        ],
      },
      design: {
        title: 'Design it',
        lead: 'A channel that looks like you.',
        points: [
          "Set your channel's look, backdrop and logo.",
          'Keep your press kit and gallery on your artist page.',
        ],
      },
      earn: {
        title: 'Earn',
        lead: 'Income straight from your fans.',
        points: [
          'Offer fan subscription tiers and paid tracks.',
          'Get paid out through Stripe.',
          'Distribute to streaming services from the studio.',
        ],
      },
      grow: {
        title: 'Grow',
        lead: 'Know your audience and reach it.',
        points: [
          'See who listens, which links get clicked and how downloads convert.',
          'Send updates to your subscribers.',
          'Auto-post new releases to Mastodon and Bluesky.',
        ],
      },
    },
    stepsEyebrow: 'Your first show',
    stepsTitle: 'On air in three steps.',
    steps: [
      {
        title: 'Claim your channel',
        body: 'Pick your channel slug in Studio. Your channel lives at /channel/your-slug and your profile at /u/your-username.',
      },
      {
        title: 'Connect your software',
        body: 'Copy the stream details from the broadcast studio into OBS, Mixxx or Traktor.',
      },
      {
        title: 'Go on air',
        body: 'Check your levels in the green room, then go live. Your rotation takes over when you sign off.',
      },
    ],
    anywhereEyebrow: 'Work where you are',
    anywhereTitle: 'Your studio goes with you.',
    anywhere: {
      apps: {
        title: 'Web, desktop and mobile',
        body: 'Run your studio at tahti.live or in the desktop app for Windows, macOS and Linux. iOS and Android are supported too.',
      },
      cli: {
        title: 'Command line',
        body: 'The tahti client uploads whole folders and manages your library from the terminal.',
      },
    },
    communityEyebrow: 'Owned by its members',
    communityTitle: 'A platform you help run.',
    communityBody:
      'Tahti is a nonprofit, and its members decide how it is run.',
    community: {
      vote: {
        title: 'You get a vote',
        body: 'Members propose and vote on motions and take part in the annual general meeting.',
      },
      open: {
        title: 'Nothing hidden',
        body: 'Public transparency reports and a live platform status page.',
      },
      source: {
        title: 'Built in the open',
        body: 'The app is AGPL-licensed open source, and feature requests come from members.',
      },
    },
    closingTitle: 'Ready to start broadcasting?',
    closingBody: 'Set up your channel and go live today.',
  },
  fi: {
    title: 'Tahti artisteille',
    subtitle: 'Sinun kanavasi, sinun musiikkisi, sinun tulosi.',
    backLabel: 'Mikä Tahti on',
    heroEyebrow: 'Itsenäisille artisteille',
    heroHeading:
      'Mene liveen, julkaise musiikkisi ja ansaitse suoraan faneiltasi.',
    heroBody:
      'Tahti on suomalainen, voittoa tavoittelematon lähetysalusta, jonka omistavat sen jäsenet. Sinä pyörität omaa kanavaasi. Kuuntelijasi kuuntelevat ilman mainoksia ja seurantaa. Yhteisö pyörittää alustaa yhdessä.',
    startCta: 'Perusta kanavasi',
    guideCta: 'Lue artistin opas',
    pillarsEyebrow: 'Kaikki yhdessä studiossa',
    pillarsTitle: 'Kuusi asiaa, jotka kanavasi tekee puolestasi.',
    pillars: {
      live: {
        title: 'Mene liveen',
        lead: 'Lähetä ohjelmalla, jota jo käytät.',
        points: [
          'Lähetä OBS:llä, Mixxxillä tai Traktorilla studiosi RTMP- tai Icecast-tiedoilla.',
          'Lähetä sama ohjelma samaan aikaan muillekin alustoille.',
          'Kutsu vieraat valmistautumishuoneeseen ennen lähetystä.',
        ],
      },
      publish: {
        title: 'Julkaise',
        lead: 'Julkaisusi, tekijätiedot kunnossa.',
        points: [
          'Lataa kappaleita ja arkistosettejä.',
          'Kokoa julkaisuja ja albumeja täysin tekijätiedoin.',
          'Jaa ne älylinkeillä ja upotuksilla.',
        ],
      },
      program: {
        title: 'Ohjelmoi kanavasi',
        lead: 'Lähetyksessä silloinkin, kun et itse ole.',
        points: [
          'Aikatauluta ohjelmasi etukäteen.',
          'Pidä 24/7-kierto käynnissä, kun olet poissa.',
        ],
      },
      design: {
        title: 'Suunnittele',
        lead: 'Kanava, joka näyttää sinulta.',
        points: [
          'Valitse kanavasi ulkoasu, tausta ja logo.',
          'Pidä lehdistöpaketti ja galleria artistisivullasi.',
        ],
      },
      earn: {
        title: 'Ansaitse',
        lead: 'Tuloja suoraan faneiltasi.',
        points: [
          'Tarjoa fanitilaustasoja ja maksullisia kappaleita.',
          'Saat maksut Stripen kautta.',
          'Jakele musiikkia suoratoistopalveluihin suoraan studiosta.',
        ],
      },
      grow: {
        title: 'Kasva',
        lead: 'Tunne yleisösi ja tavoita se.',
        points: [
          'Näe, ketkä kuuntelevat, mitä linkkejä klikataan ja miten lataukset konvertoivat.',
          'Lähetä päivityksiä tilaajillesi.',
          'Julkaise uudet julkaisut automaattisesti Mastodoniin ja Blueskyhin.',
        ],
      },
    },
    stepsEyebrow: 'Ensimmäinen lähetyksesi',
    stepsTitle: 'Lähetykseen kolmessa vaiheessa.',
    steps: [
      {
        title: 'Varaa kanavasi',
        body: 'Valitse kanavasi tunnus Studiossa. Kanavasi on osoitteessa /channel/oma-tunnus ja profiilisi /u/käyttäjänimi.',
      },
      {
        title: 'Yhdistä ohjelmasi',
        body: 'Kopioi lähetystiedot lähetysstudiosta OBS:ään, Mixxxiin tai Traktoriin.',
      },
      {
        title: 'Mene lähetykseen',
        body: 'Tarkista tasot valmistautumishuoneessa ja mene liveen. Kiertosi jatkaa, kun lopetat.',
      },
    ],
    anywhereEyebrow: 'Työskentele missä vain',
    anywhereTitle: 'Studiosi kulkee mukanasi.',
    anywhere: {
      apps: {
        title: 'Verkko, työpöytä ja mobiili',
        body: 'Käytä studiota osoitteessa tahti.live tai työpöytäsovelluksessa (Windows, macOS ja Linux). Myös iOS ja Android ovat tuettuja.',
      },
      cli: {
        title: 'Komentorivi',
        body: 'tahti-komentorivityökalu lataa kokonaisia kansioita ja hallitsee kirjastoasi päätteestä.',
      },
    },
    communityEyebrow: 'Jäsentensä omistama',
    communityTitle: 'Alusta, jota olet itse pyörittämässä.',
    communityBody:
      'Tahti on voittoa tavoittelematon, ja sen jäsenet päättävät, miten sitä pyöritetään.',
    community: {
      vote: {
        title: 'Sinulla on ääni',
        body: 'Jäsenet tekevät aloitteita, äänestävät niistä ja osallistuvat vuosikokoukseen.',
      },
      open: {
        title: 'Ei mitään piilossa',
        body: 'Julkiset läpinäkyvyysraportit ja reaaliaikainen tilasivu.',
      },
      source: {
        title: 'Avoimesti rakennettu',
        body: 'Sovellus on AGPL-lisensoitua avointa lähdekoodia, ja kehitysehdotukset tulevat jäseniltä.',
      },
    },
    closingTitle: 'Valmis aloittamaan lähettämisen?',
    closingBody: 'Perusta kanavasi ja mene liveen jo tänään.',
  },
};
