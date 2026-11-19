import type { ContentLocale } from '../lib/contentLocale';

export type WhatIsItAudienceId =
  'artists' | 'collectives' | 'listeners' | 'members';

export type WhatIsItFeatureId =
  'broadcast' | 'catalog' | 'earn' | 'discover' | 'govern' | 'open';

export type WhatIsItCopy = {
  title: string;
  subtitle: string;
  backLabel: string;
  heroEyebrow: string;
  heroHeading: string;
  heroBody: string;
  joinCta: string;
  artistsCta: string;
  howCta: string;
  audienceEyebrow: string;
  audienceTitle: string;
  audience: Record<WhatIsItAudienceId, { title: string; body: string }>;
  doesEyebrow: string;
  doesTitle: string;
  doesLead: string;
  doesPoints: Array<{ title: string; body: string }>;
  featuresEyebrow: string;
  featuresTitle: string;
  features: Record<
    WhatIsItFeatureId,
    { title: string; lead: string; points: string[] }
  >;
  moneyEyebrow: string;
  moneyTitle: string;
  moneyStats: Array<{ value: string; label: string }>;
  moneyBody: string;
  principlesEyebrow: string;
  principlesTitle: string;
  principles: string[];
  closingTitle: string;
  closingBody: string;
  aboutLink: string;
  transparencyLink: string;
  governanceLink: string;
};

export const WHAT_IS_IT_COPY: Record<ContentLocale, WhatIsItCopy> = {
  en: {
    title: 'What is Tahti',
    subtitle:
      'A nonprofit broadcasting platform owned and governed by its artist members.',
    backLabel: 'Listen',
    heroEyebrow: 'tahti.live',
    heroHeading: 'Broadcasting for independent artists — not for corporate.',
    heroBody:
      'No shareholders, no advertising, no exit. Members pay €40 a year or use the free tier. Ninety percent of operating surplus returns to artists as grants. Fan subscriptions go to the artist minus a 2% ops fee. Everything is AGPL-3.0.',
    joinCta: 'Join Tahti',
    artistsCta: 'Tahti for artists',
    howCta: 'How it works',
    audienceEyebrow: 'Who it is for',
    audienceTitle: 'Built for people who make and share music.',
    audience: {
      artists: {
        title: 'Artists & DJs',
        body: 'Live sets, radio shows, 24/7 channels and releases — without stitching five vendors together.',
      },
      collectives: {
        title: 'Bands & crews',
        body: 'Shared channels, hand-offs between shows, and one home for the collective catalogue.',
      },
      listeners: {
        title: 'Listeners',
        body: 'Tune in anonymously. No ads, no tracking cookies. Lossless FLAC on member channels.',
      },
      members: {
        title: 'Members',
        body: 'Every artist member has a vote. The membership elects the board and steers the roadmap.',
      },
    },
    doesEyebrow: 'What it does',
    doesTitle: 'One platform instead of five disconnected tools.',
    doesLead:
      'Independent artists who want to broadcast are forced to rent a streaming host, a release toolkit, a fan-payment middleman, and a site they do not control — with no vote when the terms change.',
    doesPoints: [
      {
        title: 'Always-on channel',
        body: 'Live HLS when you are on air; archive rotation when you are not. One address for fans.',
      },
      {
        title: 'Studio & catalogue',
        body: 'Upload, edit, release and embed from the same library — credits and metadata included.',
      },
      {
        title: 'Money that tips your way',
        body: 'Fan subs go to you. Surplus funds annual grants. The ledger is public.',
      },
    ],
    featuresEyebrow: 'What you get',
    featuresTitle: 'The pieces that replace the patchwork.',
    features: {
      broadcast: {
        title: 'Live & radio',
        lead: 'Go live from the software you already use.',
        points: [
          'OBS, Mixxx, Traktor or browser — RTMP / Icecast credentials in Studio.',
          'Green room, auto-record, multistream to Twitch, YouTube or Kick.',
          'Book slots on Tahti Radio, the community meta-stream.',
        ],
      },
      catalog: {
        title: 'Library & releases',
        lead: 'From upload to official release in one place.',
        points: [
          'Resumable uploads, cloud import, in-browser editor and revisions.',
          'Release checklist, credits, MusicBrainz / Discogs / ISRC helpers.',
          'Smart links, embeds and DSP claim pointers.',
        ],
      },
      earn: {
        title: 'Fans & grants',
        lead: 'Direct support plus a shared grant pool.',
        points: [
          'Fan subscriptions via Stripe Connect — 2% ops fee into the grant pool.',
          'One-time purchases and pay-what-you-want tiers.',
          'Annual grants: 90% of operating surplus by engagement units.',
        ],
      },
      discover: {
        title: 'Listen & discover',
        lead: 'No algorithmic feed to game.',
        points: [
          'What’s live, replays and new releases — ranked by people, not by a black box.',
          'Signed-in For you is follows and history only.',
          'Channel, release and third-party embeds.',
        ],
      },
      govern: {
        title: 'Co-op governance',
        lead: 'A Finnish yhdistys you belong to.',
        points: [
          'One member, one vote; public motions and AGM records.',
          'Append-only transparency ledger for every euro.',
          'Constitution locks out ads, data sales and vanity ranking.',
        ],
      },
      open: {
        title: 'Open source',
        lead: 'AGPL-3.0 end to end.',
        points: [
          'Read it, self-host it, fork it — hosted forks share their source.',
          'Export your catalogue and fan records anytime.',
          'Artists keep full copyright on everything they upload.',
        ],
      },
    },
    moneyEyebrow: 'Money at a glance',
    moneyTitle: 'Designed so the surplus stays with artists.',
    moneyStats: [
      { value: '€40', label: 'artist membership / year' },
      { value: '€0', label: 'to listen — always' },
      { value: '98%', label: 'of each fan-sub euro → you' },
      { value: '90%', label: 'of surplus → artist grants' },
    ],
    moneyBody:
      'Free-tier artists get MP3 and limited live hours; members broadcast lossless FLAC with no weekly airtime cap. The 2% fan-sub fee covers cards, GDPR and ops — and rolls into the grant pool. No platform cut for Tahti itself.',
    principlesEyebrow: 'Three rules',
    principlesTitle: 'Written into the constitution.',
    principles: [
      'This is for artists, not for corporate. Administration paid fairly. No profit motive.',
      'Highest quality, useful, community-driven platform — by design.',
      'The artist shines brightest. We don’t rip off anyone in the chain.',
    ],
    closingTitle: 'You won’t be a user here — you’ll be a member.',
    closingBody:
      'Start a channel, go live, publish a release, or just listen. When you join as an artist, you help decide what we build next.',
    aboutLink: 'About Tahti',
    transparencyLink: 'Transparency ledger',
    governanceLink: 'Governance',
  },
  fi: {
    title: 'Mikä on Tahti',
    subtitle:
      'Voittoa tavoittelematon lähetysalusta, jonka omistavat ja jota hallitsevat artistijäsenet.',
    backLabel: 'Kuuntele',
    heroEyebrow: 'tahti.live',
    heroHeading: 'Lähettämistä itsenäisille artisteille — ei yrityksille.',
    heroBody:
      'Ei osakkeenomistajia, ei mainoksia, ei exit-tarinaa. Jäsenet maksavat 40 € vuodessa tai käyttävät ilmaistasoa. 90 % toimintaylijäämästä palaa artisteille apurahoina. Fanitilaukset menevät artistille 2 %:n toimintamaksulla. Kaikki on AGPL-3.0.',
    joinCta: 'Liity Tahtiin',
    artistsCta: 'Tahti artisteille',
    howCta: 'Näin se toimii',
    audienceEyebrow: 'Kenelle',
    audienceTitle: 'Niille, jotka tekevät ja jakavat musiikkia.',
    audience: {
      artists: {
        title: 'Artistit ja DJ:t',
        body: 'Live-setit, radio-ohjelmat, 24/7-kanavat ja julkaisut — ilman viiden palvelun tilkkutäkkiä.',
      },
      collectives: {
        title: 'Bändit ja kollektiivit',
        body: 'Yhteiset kanavat, ohjelmavaihdot ja yksi koti yhteiselle katalogille.',
      },
      listeners: {
        title: 'Kuuntelijat',
        body: 'Kuuntele anonyymisti. Ei mainoksia, ei seurantakeksejä. Häviötön FLAC jäsenkanavilla.',
      },
      members: {
        title: 'Jäsenet',
        body: 'Jokaisella artistijäsenellä on ääni. Jäsenistö valitsee hallituksen ja ohjaa tiekarttaa.',
      },
    },
    doesEyebrow: 'Mitä se tekee',
    doesTitle: 'Yksi alusta viiden irrallisen työkalun sijaan.',
    doesLead:
      'Itsenäinen artisti, joka haluaa lähettää, joutuu vuokraamaan striimihostin, julkaisutyökalut, fanien maksupalvelun ja sivuston jota ei hallitse — ilman ääntä, kun ehdot muuttuvat.',
    doesPoints: [
      {
        title: 'Aina päällä oleva kanava',
        body: 'Live-HLS kun olet ilmassa; arkistorotaatio kun et ole. Yksi osoite faneille.',
      },
      {
        title: 'Studio ja katalogi',
        body: 'Lataa, editoi, julkaise ja upota samasta kirjastosta — krediitit ja metadata mukana.',
      },
      {
        title: 'Raha kallistuu sinuun',
        body: 'Fanitilaukset menevät sinulle. Ylijäämä rahoittaa vuosittaiset apurahat. Kirjanpito on julkinen.',
      },
    ],
    featuresEyebrow: 'Mitä saat',
    featuresTitle: 'Palaset, jotka korvaavat tilkkutäkin.',
    features: {
      broadcast: {
        title: 'Live ja radio',
        lead: 'Mene liveen ohjelmistoilla joita jo käytät.',
        points: [
          'OBS, Mixxx, Traktor tai selain — RTMP-/Icecast-tunnukset Studiossa.',
          'Green room, automaattinen tallenne, monistriimi Twitchiin, YouTubeen tai Kickiin.',
          'Varaa aikoja Tahti Radiosta, yhteisön meta-striimistä.',
        ],
      },
      catalog: {
        title: 'Kirjasto ja julkaisut',
        lead: 'Latauksesta viralliseen julkaisuun yhdessä paikassa.',
        points: [
          'Jatkuvat lataukset, pilvituonti, selaineditori ja versiot.',
          'Julkaisun tarkistuslista, krediitit, MusicBrainz-/Discogs-/ISRC-apu.',
          'Älylinkit, upotukset ja DSP-vaatimusten linkit.',
        ],
      },
      earn: {
        title: 'Fanit ja apurahat',
        lead: 'Suora tuki plus yhteinen apurahapotti.',
        points: [
          'Fanitilaukset Stripe Connectilla — 2 %:n toimintamaksu apurahapottiin.',
          'Kertostot ja maksa-mitä-haluat-tasot.',
          'Vuosittaiset apurahat: 90 % toimintaylijäämästä engagement-yksiköillä.',
        ],
      },
      discover: {
        title: 'Kuuntelu ja löytäminen',
        lead: 'Ei algoritmista syötettä pelattavaksi.',
        points: [
          'Mikä on live, toistot ja uudet julkaisut — ihmisten, ei mustan laatikon mukaan.',
          'Kirjautuneen Sinulle-näkymä on vain seuraukset ja historia.',
          'Kanava-, julkaisu- ja kolmannen osapuolen upotukset.',
        ],
      },
      govern: {
        title: 'Osuuskuntamainen hallinto',
        lead: 'Suomalainen yhdistys johon kuulut.',
        points: [
          'Yksi jäsen, yksi ääni; julkiset esitykset ja vuosikokousaineistot.',
          'Lisäävä läpinäkyvyyskirjanpito jokaiselle eurolle.',
          'Perussääntö kieltää mainokset, datan myynnin ja turhamaisuusmittarit.',
        ],
      },
      open: {
        title: 'Avoin lähdekoodi',
        lead: 'AGPL-3.0 alusta loppuun.',
        points: [
          'Lue, hostaa itse, haaroita — verkossa ajettavat haarukat jakavat lähdekoodinsa.',
          'Vie katalogisi ja fanitietosi milloin tahansa.',
          'Artistit säilyttävät täyden tekijänoikeuden kaikkeen lataamaansa.',
        ],
      },
    },
    moneyEyebrow: 'Raha lyhyesti',
    moneyTitle: 'Suunniteltu niin, että ylijäämä jää artisteille.',
    moneyStats: [
      { value: '40 €', label: 'artistijäsenyys / vuosi' },
      { value: '0 €', label: 'kuuntelu — aina' },
      { value: '98 %', label: 'fanitilauksen eurosta → sinulle' },
      { value: '90 %', label: 'ylijäämästä → apurahat' },
    ],
    moneyBody:
      'Ilmaistason artistit lähettävät MP3:lla ja rajoitetulla liveajalla; jäsenet lähettävät häviötöntä FLAC:ia ilman viikoittaista aikakattoa. 2 %:n fanitilausmaksu kattaa kortit, GDPR:n ja ylläpidon — ja menee apurahapottiin. Tahdilla itsellään ei ole omaa leikkausta.',
    principlesEyebrow: 'Kolme sääntöä',
    principlesTitle: 'Kirjattu perussääntöön.',
    principles: [
      'Tämä on artisteille, ei yrityksille. Hallinto maksetaan reilusti. Ei voittomotiivia.',
      'Korkein laatu, hyödyllinen, yhteisöohjattu alusta — suunnittelusta lähtien.',
      'Artisti loistaa kirkkaimpana. Emme kisko ketään ketjussa.',
    ],
    closingTitle: 'Et ole täällä käyttäjä — olet jäsen.',
    closingBody:
      'Aloita kanava, mene liveen, julkaise release tai kuuntele vain. Kun liityt artistina, päätät yhdessä mitä rakennamme seuraavaksi.',
    aboutLink: 'Tietoa Tahdista',
    transparencyLink: 'Läpinäkyvyyskirjanpito',
    governanceLink: 'Hallinto',
  },
};
