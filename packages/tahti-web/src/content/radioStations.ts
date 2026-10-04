export type RadioStation = {
  id: string;
  name: string;
  logoUrl: string;
  language: string;
  bitrateKbps: number;
  codec: string;
  genre: string;
  streamUrl: string | null;
  detailUrl: string;
  programmingUrl?: string | null;
};

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'ylex',
    name: 'YleX',
    logoUrl: '/radio-logos/ylex.png',
    language: 'Finnish',
    bitrateKbps: 128,
    codec: 'AAC',
    genre: 'Pop / Hits',
    streamUrl: 'https://icecast.live.yle.fi/radio/YleX/icecast.audio',
    detailUrl: 'https://areena.yle.fi/podcastit/ohjelmat/57-3BdQK6a2a',
    programmingUrl: 'https://areena.yle.fi/audio/ohjelmat/yle-x',
  },
  {
    id: 'radio-helsinki',
    name: 'Radio Helsinki',
    logoUrl: '/radio-logos/radio-helsinki.png',
    language: 'Finnish',
    bitrateKbps: 256,
    codec: 'MP3',
    genre: 'Talk / Variety',
    streamUrl: 'https://stream.radiohelsinki.fi/stream',
    detailUrl: 'https://www.radiohelsinki.fi/',
    programmingUrl: 'https://www.radiohelsinki.fi/ohjelmakartta/',
  },
  {
    id: 'radio-rock',
    name: 'Radio Rock',
    logoUrl: '/radio-logos/radio-rock.jpg',
    language: 'Finnish',
    bitrateKbps: 256,
    codec: 'AAC',
    genre: 'Rock',
    streamUrl:
      'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8',
    detailUrl: 'https://www.radiorock.fi/',
    programmingUrl: 'https://www.radiorock.fi/',
  },
  {
    id: 'suomipop',
    name: 'Suomipop',
    logoUrl: '/radio-logos/suomipop.jpg',
    language: 'Finnish',
    bitrateKbps: 256,
    codec: 'AAC',
    genre: 'Pop',
    streamUrl:
      'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8',
    detailUrl: 'https://www.supla.fi/suomipop',
    programmingUrl: 'https://www.supla.fi/suomipop',
  },
  {
    id: 'nrj-fi',
    name: 'NRJ',
    logoUrl: '/radio-logos/nrj.jpg',
    language: 'Finnish',
    bitrateKbps: 64,
    codec: 'AAC',
    genre: 'Pop / Hits',
    streamUrl:
      'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein',
    detailUrl: 'https://www.radioplay.fi/nrj',
    programmingUrl: 'https://www.radioplay.fi/nrj',
  },
  {
    id: 'radio-nova',
    name: 'Radio Nova',
    logoUrl: '/radio-logos/radio-nova.jpg',
    language: 'Finnish',
    bitrateKbps: 64,
    codec: 'AAC',
    genre: 'Pop',
    streamUrl:
      'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein',
    detailUrl: 'https://www.radioplay.fi/radio-nova',
    programmingUrl: 'https://www.radioplay.fi/radio-nova',
  },
];

export const DEFAULT_ENABLED_STATION_IDS: string[] = RADIO_STATIONS.map(
  (station) => station.id,
);

export function radioStation(id: string): RadioStation | undefined {
  return RADIO_STATIONS.find((s) => s.id === id);
}

const CATALOG_PLAYABLE_PREFIX = 'radio-widget:';
const PRESET_PLAYABLE_PREFIX = 'radio-preset:';

/** True for a playable that is an internet radio stream (a catalog station
 * or an admin preset), as opposed to a Tahti channel. */
export function isInternetRadioPlayableId(id: string): boolean {
  return (
    id.startsWith(CATALOG_PLAYABLE_PREFIX) ||
    id.startsWith(PRESET_PLAYABLE_PREFIX)
  );
}

/** The catalog station a playing internet radio stream belongs to, so the
 * player can link to its page. Presets carry no catalog id and are matched
 * by station name, which the player keeps as the title or the artist line. */
export function radioStationIdForPlayable(playable: {
  id: string;
  title: string;
  artist: string;
}): string | undefined {
  if (playable.id.startsWith(CATALOG_PLAYABLE_PREFIX)) {
    const id = playable.id.slice(CATALOG_PLAYABLE_PREFIX.length);
    return radioStation(id)?.id;
  }
  if (playable.id.startsWith(PRESET_PLAYABLE_PREFIX)) {
    return RADIO_STATIONS.find(
      (station) =>
        station.name === playable.artist || station.name === playable.title,
    )?.id;
  }
  return undefined;
}

export function radioStationPlayable(
  station: RadioStation & { streamUrl: string },
): {
  id: string;
  kind: 'radio';
  title: string;
  artist: string;
  coverUrl: string;
  streamUrl: string;
  protocol: 'https';
  sourceProvider: string;
} {
  return {
    id: `radio-widget:${station.id}`,
    kind: 'radio',
    title: station.name,
    artist: `${station.language} · ${station.genre}`,
    coverUrl: station.logoUrl,
    streamUrl: station.streamUrl,
    protocol: 'https',
    sourceProvider: 'internet-radio',
  };
}
