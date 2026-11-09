import type { HelpTable } from './help';
import { READY_PLUGIN_HELP } from './pluginHelpCatalog';

type PluginHelpTranslation = {
  name?: string;
  stateLabel: string;
  description: string;
  help: string;
};

const CATEGORY_FI: Record<string, string> = {
  Themes: 'Teemat',
  Visualizers: 'Visualisoinnit',
  Import: 'Tuonti',
  Multicast: 'Monilähetys',
  Fingerprinting: 'Tunnistus',
  'Audio tools': 'Äänityökalut',
  Radio: 'Radio',
  Embed: 'Upotus',
  Discovery: 'Löytäminen',
  Channel: 'Kanava',
  Playback: 'Toisto',
  Scrobbling: 'Scrobblaus',
};

const READY = 'Valmis';

const multicast = (service: string, help: string): PluginHelpTranslation => ({
  stateLabel: READY,
  description: `Peilaa Tahti-lähetyksesi palveluun ${service}.`,
  help,
});

/** Finnish rows for the Help Center add-ons table, keyed by the English
 * add-on name in `READY_PLUGIN_HELP`. */
const PLUGIN_HELP_FI: Record<string, PluginHelpTranslation> = {
  'App themes': {
    name: 'Sovellusteemat',
    stateLabel: READY,
    description:
      'Värittää koko sovelluksen ja julkisen kanavasi valmiista paletista tai tuomastasi JSON-teemasta.',
    help: 'Vaihda palettia tai tuo oma teema-JSON kohdassa Asetukset → Lisäosat → Teemat.',
  },
  'Channel visualizers': {
    name: 'Kanavan visualisoinnit',
    stateLabel: READY,
    description:
      'Animoi kanavasi ja koko näytön soittimen taustan parhaillaan soivan äänen tahdissa.',
    help: 'Valitse visualisointi kohdassa Asetukset → Lisäosat → Visualisoinnit tai Studio → Kanava. Tarjolla on kymmenen WebGL-esiasetusta ja Minimal, kun ääni soi.',
  },
  'Local upload': {
    name: 'Paikallinen lataus',
    stateLabel: READY,
    description: 'Lataa äänitiedostot suoraan laitteeltasi Tahti-arkistoosi.',
    help: 'Studio → Lähetä (tai Kirjasto → Lataa) vie äänitiedostot arkistoosi.',
  },
  Soulseek: {
    stateLabel: 'Työpöytäversio suunnitteilla',
    description:
      'Hae ja lataa Soulseekistä paikalliseen kirjastoosi työpöytäsoittimella. Selain ei osaa Soulseek-protokollaa, eikä Tahti välitä vertaisverkon liikennettä.',
    help: 'Asetukset → Lisäosat → Tuonti → Soulseek → Määritä. Yhteystesti pysyy pois käytöstä, kunnes työpöytäsovelluksen silta julkaistaan. Levyltä soitettavat tiedostot ovat Tahti Player -työpöytäsovelluksessa kohdassa Kirjasto → Paikalliset tiedostot.',
  },
  Stash: {
    stateLabel: READY,
    description:
      'Yksityinen tiedostovarasto stemmeille, mastereille ja keskeneräisille töille. Ne eivät koskaan näy julkisella kanavallasi.',
    help: 'Studio → Stash säilyttää yksityiset stemmit ja masterit. Tiedostot pysyvät poissa julkiselta kanavalta, kunnes julkaiset ne.',
  },
  SoundCloud: {
    stateLabel: READY,
    description:
      'Yhdistää SoundCloud-tilisi, jotta voit tuoda omat ladattavat kappaleesi Tahti-arkistoosi.',
    help: 'Yhdistä kohdassa Asetukset → Lisäosat → Tuonti tai Lähteet, selaa ladattavia kappaleita ja lisää palvelinpuolen tuonti jonoon.',
  },
  Bandcamp: {
    stateLabel: 'Vain yhdistäminen',
    description:
      'Yhdistää Bandcamp-tilisi. Albumilistaus ja luettelon tuonti odottavat Bandcampin API-hyväksyntää; linkitetyt kappaleet soivat Bandcampin soittimella.',
    help: 'Yhdistä Bandcamp kohdassa Lähteet. Luettelon tuonti ei ole vielä käytettävissä: API merkitsee Bandcamp-tuonnin pois käytöstä, kunnes Bandcamp API v1 valmistuu.',
  },
  'Google Drive': {
    stateLabel: READY,
    description: 'Tuo äänitiedostoja Google Drivesta pilvituontitehtävinä.',
    help: 'Yhdistä Drive kohdassa Lähteet ja tuo äänitiedostot pilvituontitehtävinä.',
  },
  Mixcloud: {
    stateLabel: READY,
    description:
      'Yhdistää Mixcloudin, jotta voit pelastaa vanhat miksauksesi arkistoon tai lähettää arkiston miksauksia takaisin Mixcloudiin.',
    help: 'Yhdistä Mixcloud kohdassa Lähteet pelastaaksesi miksauksia arkistoon tai lähettääksesi niitä sieltä.',
  },
  'Spotify search': {
    name: 'Spotify-haku',
    stateLabel: READY,
    description:
      'Hakee Spotifyn julkisesta luettelosta, lataa linkitetyn artistiluettelosi tai toisen artistin osoitteen ja lisää kappaleita monilähteisiin kokoelmiin; Spotifyn soitin toistaa oikean kappaleen sovelluksessa.',
    help: 'Avaa kokoelma ja valitse Lisää Spotifysta. Hae julkisesta luettelosta, lataa linkitetty artistisi tai liitä toisen artistin osoite ja lisää kappaleet Spotify-upotuksina.',
  },
  'hearthis.at search': {
    name: 'hearthis.at-haku',
    stateLabel: READY,
    description:
      'Hakee hearthis.atin julkisesta luettelosta ja lisää kappaleet palvelun isännöiminä upotuksina, jotka soivat sovelluksessa.',
    help: 'Hae hearthis.atin julkisesta luettelosta kohdassa Lähteet ja lisää kappaleet palvelun isännöiminä upotuksina.',
  },
  'URL / DSP paste': {
    name: 'Osoitteen / DSP-linkin liittäminen',
    stateLabel: READY,
    description:
      'Täyttää julkaisun älylinkin palvelupainikkeet liitetystä suoratoistopalvelun osoitteesta.',
    help: 'Liitä Spotify-, Bandcamp- tai vastaava osoite, kun rakennat julkaisun älylinkkiä.',
  },
  'YouTube Live': multicast(
    'YouTube Live',
    'Lisää YouTube-kohde kohdassa Asetukset → Lisäosat → Monilähetys tai Studio → Lähetys. Liitä lähetysavain YouTube Studiosta.',
  ),
  Twitch: multicast(
    'Twitch',
    'Lisää Twitch-kohde ingest-lähetysavaimellasi, niin live-lähetys peilautuu sinne, kun lähetät Tahdissa.',
  ),
  'Facebook Live': multicast(
    'Facebook Live',
    'Lisää Facebook-kohde ja lähetysavain Facebook Live Producerista.',
  ),
  Kick: multicast(
    'Kick',
    'Lisää Kick-kohde. Anna ingest-osoite, jos Kick ei käytä oletusarvoista RTMP-osoitetta.',
  ),
  'TikTok Live': multicast(
    'TikTok LIVE',
    'Lisää TikTok-kohde TikTok LIVE Centerin lähetysavaimella.',
  ),
  'Mixcloud Live': multicast(
    'Mixcloud Live',
    'Lisää Mixcloud Live -kohde avaimella, jonka löydät Mixcloudin live-lähetysasetuksista.',
  ),
  'Instagram Live': multicast(
    'Instagram Live',
    'Lisää Instagram-kohde Instagramin ammattilaistyökalujen RTMPS-ingest-osoitteella ja avaimella.',
  ),
  'Custom RTMP': {
    name: 'Oma RTMP',
    stateLabel: READY,
    description:
      'Peilaa Tahti-lähetyksesi mihin tahansa muuhun enkooderiin tai palveluun, joka ottaa vastaan RTMP-lähetyksen.',
    help: 'Valitse Oma RTMP ja liitä sekä ingest-osoite että lähetysavain mille tahansa muulle kohteelle.',
  },
  AcoustID: {
    stateLabel: READY,
    description:
      'Laskee kappaleen äänestä sormenjäljen ja vertaa sitä AcoustID/MusicBrainz-tietokantaan luettelotietojen täyttämiseksi.',
    help: 'Avaa kappale kohdassa Studio → Musiikki ja aja sormenjälkivertailu tai uusintatarkistus hakeaksesi luettelotiedot.',
  },
  EQ: {
    stateLabel: READY,
    description:
      'Monikaistainen taajuuskorjain sävyn muokkaamiseen Pro-editorissa.',
    help: 'Ota se käyttöön kohdassa Asetukset → Lisäosat → Äänityökalut ja lisää se Pro-editorin ketjuun.',
  },
  Compressor: {
    name: 'Kompressori',
    stateLabel: READY,
    description: 'Tasoittaa kovia ja hiljaisia kohtia ennen vientiä.',
    help: 'Ota se käyttöön kohdassa Äänityökalut ja tasoita dynamiikkaa Pro-editorissa ennen vientiä.',
  },
  Limiter: {
    name: 'Limitteri',
    stateLabel: READY,
    description: 'Rajoittaa huippuvoimakkuuden, jotta vienti ei säröydy.',
    help: 'Ota se käyttöön kohdassa Äänityökalut. Editorin esikuuntelu on nopea katto; viennin renderöinti on lopullinen tiedosto.',
  },
  Filter: {
    name: 'Suodin',
    stateLabel: READY,
    description:
      'Alipäästö-, ylipäästö- ja hyllysuodatus valittavalla jyrkkyydellä taajuusalueiden leikkaamiseen tai muotoiluun.',
    help: 'Ota se käyttöön kohdassa Äänityökalut ja valitse Pro-editorissa alipäästö, ylipäästö tai hylly.',
  },
  'Curated internet radio stations': {
    name: 'Valitut verkkoradioasemat',
    stateLabel: READY,
    description:
      'Lisää verkkoradioasemia pääsoittimeen Tahti-kanavien rinnalle: suomalaiset asemat, minkä tahansa aseman julkisesta Radio Browser -hakemistosta sekä oman M3U/M3U8-soittolistan tai suoran stream-osoitteen.',
    help: 'Avaa Asetukset → Lisäosat → Radio. Kytke päälle haluamasi suomalaiset asemat, tallenna asemia Selaimesta tai lisää oma M3U-soittolista tai stream kohdasta Lisää osoite.',
  },
  'SoundCloud embed': {
    name: 'SoundCloud-upotus',
    stateLabel: READY,
    description:
      'Lisää julkiselle Kuuntele-sivullesi soitettavan SoundCloud-kappaleen, -setin tai -soittolistan.',
    help: 'Asetukset → Lisäosat → Upotus. Liitä SoundCloud-kappaleen, -setin tai -soittolistan osoite Kuuntele-sivullesi.',
  },
  'YouTube embed': {
    name: 'YouTube-upotus',
    stateLabel: READY,
    description:
      'Lisää Kuuntele-sivullesi soitettavan YouTube-videon tai -soittolistan.',
    help: 'Asetukset → Lisäosat → Upotus. Liitä YouTube-videon tai -soittolistan osoite.',
  },
  'Spotify playlist embed': {
    name: 'Spotify-soittolistan upotus',
    stateLabel: READY,
    description: 'Lisää Kuuntele-sivullesi soitettavan Spotify-soittolistan.',
    help: 'Asetukset → Lisäosat → Upotus. Liitä vain julkisen Spotify-soittolistan osoite.',
  },
  'hearthis.at embed': {
    name: 'hearthis.at-upotus',
    stateLabel: READY,
    description: 'Lisää Kuuntele-sivullesi soitettavan hearthis.at-kappaleen.',
    help: 'Asetukset → Lisäosat → Upotus. Liitä hearthis.at-upotusosoite tai kappaleen numerotunnus.',
  },
  'Listen-page Disco-widgets': {
    name: 'Kuuntele-sivun Disco-widgetit',
    stateLabel: READY,
    description:
      'Eristetyt yhteisön tekemät widgetit, jotka näkyvät omalla Kuuntele-sivullasi vain sinulle.',
    help: 'Asenna eristettyjä widgettejä kohdassa Asetukset → Lisäosat → Löytäminen. Vain sinä näet ne Kuuntele-sivulla. Uuden widgetin julkaisuohjeet ovat kohdassa Ohjeet → Tee oma Disco-widget.',
  },
  'Channel Disco-widgets': {
    name: 'Kanavan Disco-widgetit',
    stateLabel: READY,
    description:
      'Eristetyt yhteisön tekemät widgetit, jotka näkyvät julkisella kanavallasi ja artistisivullasi kaikille kuulijoille.',
    help: 'Asenna julkisia widgettejä kohdassa Asetukset → Lisäosat → Kanava. Kuulijat näkevät ne kanavallasi ja artistisivullasi.',
  },
  MediaSession: {
    stateLabel: READY,
    description:
      'Tuo Tahdin soittimen kuulokkeiden, lukitusnäytön ja käyttöjärjestelmän mediapainikkeiden ohjattavaksi.',
    help: 'Aina päällä. Kuulokkeet, lukitusnäyttö ja käyttöjärjestelmän mediapainikkeet ohjaavat Tahdin soitinta. Asetuksia ei tarvita.',
  },
  ListenBrainz: {
    stateLabel: READY,
    description:
      'Kun Tahti-kappale lasketaan kuunteluksi, se lähetetään ListenBrainz-profiiliisi. Listat ja koontinäkymät eivät kuulu mukaan.',
    help: 'Asetukset → Lisäosat → Scrobblaus → Määritä. Liitä ListenBrainz-käyttäjätunnisteesi ja valitse Tallenna ja ota käyttöön. Kelvolliset kirjautuneet kuuntelut lähetetään automaattisesti; Katkaise yhteys poistaa tallennetun tunnisteen.',
  },
  'Last.fm': {
    stateLabel: READY,
    description:
      'Kun Tahti-kappale lasketaan kuunteluksi, se lähetetään Last.fm-profiiliisi. Listat ja suositukset eivät kuulu mukaan.',
    help: 'Asetukset → Lisäosat → Scrobblaus → Yhdistä. Hyväksy Tahti Last.fm:ssä; palaat tänne, kun yhteys on valmis. Katkaise yhteys poistaa tallennetun istunnon. Vaatii palvelimelle Last.fm-API-avaimet.',
  },
};

/** English names without a Finnish row, so a new add-on can't silently
 * fall back to English in the Finnish table. */
export function missingPluginHelpFi(): string[] {
  return READY_PLUGIN_HELP.filter((plugin) => !PLUGIN_HELP_FI[plugin.name]).map(
    (plugin) => plugin.name,
  );
}

export const PLUGIN_HELP_TABLE_FI: HelpTable = {
  columns: ['Nimi', 'Luokka', 'Tila', 'Mitä se tekee', 'Näin käytät sitä'],
  rows: READY_PLUGIN_HELP.map((plugin) => {
    const fi = PLUGIN_HELP_FI[plugin.name];
    if (!fi) {
      return [
        plugin.name,
        CATEGORY_FI[plugin.category] ?? plugin.category,
        plugin.stateLabel,
        plugin.description,
        plugin.help,
      ];
    }
    return [
      fi.name ?? plugin.name,
      CATEGORY_FI[plugin.category] ?? plugin.category,
      fi.stateLabel,
      fi.description,
      fi.help,
    ];
  }),
};
