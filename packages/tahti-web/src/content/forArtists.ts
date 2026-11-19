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
          'Stream from OBS, Mixxx, Traktor or the browser with RTMP or Icecast details from Studio.',
          'Green room, auto-record, show series — and multistream to Twitch, YouTube or Kick.',
          'Book slots on Tahti Radio; the Discord voice bot can carry the meta-stream.',
        ],
      },
      publish: {
        title: 'Publish',
        lead: 'Your releases, credited properly.',
        points: [
          'Upload or import tracks, sets and recordings; edit in the waveform editor.',
          'Build releases with credits, stems, smart links and embeds.',
          'Deliver to DSPs (Revelator) and publish to Mixcloud from Studio.',
        ],
      },
      program: {
        title: 'Program your channel',
        lead: 'On air even when you are not.',
        points: [
          'Schedule shows and keep a 24/7 archive or collection rotation.',
          'Shuffle, fair rotation and auto-enrol new uploads when you want them.',
        ],
      },
      design: {
        title: 'Design it',
        lead: 'A channel that looks like you.',
        points: [
          'Channel Designer: looks, audio-reactive visualizers, layout blocks and banners.',
          'Press kit, gallery and identity live on Settings → Artist info.',
        ],
      },
      earn: {
        title: 'Earn',
        lead: 'Income straight from your fans.',
        points: [
          'Fan subscription tiers, one-time store tiers and pay-what-you-want tracks.',
          'Get paid out through Stripe Connect — 98% to you, 2% ops into the grant pool.',
          'Qualify for annual artist grants from platform surplus.',
        ],
      },
      grow: {
        title: 'Grow',
        lead: 'Know your audience and reach it.',
        points: [
          'Stats for plays, downloads, geography and devices.',
          'Live chat, DMs, posts and newsletters.',
          'Desktop Tahti Player, plugin Store and tahti CLI for bulk work.',
        ],
      },
    },
    stepsEyebrow: 'Your first show',
    stepsTitle: 'On air in three steps.',
    steps: [
      {
        title: 'Claim your channel',
        body: 'Pick your channel slug in Studio. Your channel lives at /c/your-slug and your profile at /u/your-username.',
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
        title: 'Web, desktop and phone',
        body: 'Run Studio at tahti.live or in the desktop Tahti Player for Windows, macOS and Linux. The same web app works in a phone browser.',
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
          'Lähetä OBS:llä, Mixxxillä, Traktorilla tai selaimella Studion RTMP- tai Icecast-tiedoilla.',
          'Green room, automaattinen tallenne, ohjelmasarjat — ja monistriimi Twitchiin, YouTubeen tai Kickiin.',
          'Varaa aikoja Tahti Radiosta; Discord-äänibotti voi kantaa meta-striimin.',
        ],
      },
      publish: {
        title: 'Julkaise',
        lead: 'Julkaisusi, tekijätiedot kunnossa.',
        points: [
          'Lataa tai tuo kappaleita, settejä ja tallenteita; editoi aaltomuotieditorissa.',
          'Kokoa julkaisuja krediiteillä, stemmeillä, älylinkeillä ja upotuksilla.',
          'Toimita DSP:lle (Revelator) ja julkaise Mixcloudiin Studiosta.',
        ],
      },
      program: {
        title: 'Ohjelmoi kanavasi',
        lead: 'Lähetyksessä silloinkin, kun et itse ole.',
        points: [
          'Aikatauluta ohjelmat ja pidä 24/7-arkisto- tai kokoelmakierto käynnissä.',
          'Satunnainen tai tasapuolinen kierto ja uusien latausten automaattinen lisäys.',
        ],
      },
      design: {
        title: 'Suunnittele',
        lead: 'Kanava, joka näyttää sinulta.',
        points: [
          'Channel Designer: lookit, äänireaktiiviset visualisoijat, lohkot ja bannerit.',
          'Lehdistöpaketti, galleria ja identiteetti ovat Asetukset → Artistitiedot -osiossa.',
        ],
      },
      earn: {
        title: 'Ansaitse',
        lead: 'Tuloja suoraan faneiltasi.',
        points: [
          'Fanitilaustasot, kertostot ja maksa-mitä-haluat-kappaleet.',
          'Maksut Stripe Connectilla — 98 % sinulle, 2 % toimintamaksu apurahapottiin.',
          'Kelpoisuus vuosittaisiin apurahoihin alustan ylijäämästä.',
        ],
      },
      grow: {
        title: 'Kasva',
        lead: 'Tunne yleisösi ja tavoita se.',
        points: [
          'Tilastot toistoista, latauksista, maista ja laitteista.',
          'Live-chat, yksityisviestit, postaukset ja uutiskirjeet.',
          'Työpöytä-Tahti Player, laajennus-Store ja tahti-CLI massatyöhön.',
        ],
      },
    },
    stepsEyebrow: 'Ensimmäinen lähetyksesi',
    stepsTitle: 'Lähetykseen kolmessa vaiheessa.',
    steps: [
      {
        title: 'Varaa kanavasi',
        body: 'Valitse kanavasi tunnus Studiossa. Kanavasi on osoitteessa /c/oma-tunnus ja profiilisi /u/käyttäjänimi.',
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
        title: 'Verkko, työpöytä ja puhelin',
        body: 'Käytä Studiota osoitteessa tahti.live tai työpöytä-Tahti Playerissa (Windows, macOS, Linux). Sama web-sovellus toimii myös puhelimen selaimessa.',
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
