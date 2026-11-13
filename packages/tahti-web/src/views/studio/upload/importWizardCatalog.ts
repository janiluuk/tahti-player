import { i18n } from '@tahti-player/i18n';

import { fetchSocialConnections } from '../../../api/artist-settings/social';
import type { SocialConnections } from '../../../api/artist-settings/social';
import { fetchConnectionStatus } from '../../../api/sources';
import {
  fetchHearthisArtistTracks,
  fetchHearthisCollectionTracks,
  fetchHearthisLibrary,
  importHearthisTracks,
  type HearthisTrack,
} from '../../../api/sources/hearthis';
import {
  addMixcloudCloudcast,
  fetchMixcloudProfileCloudcasts,
  fetchMyMixcloudCloudcasts,
} from '../../../api/sources/mixcloud';
import {
  fetchSoundcloudPlaylists,
  fetchSoundcloudPlaylistTracks,
  fetchSoundcloudTracks,
  importSoundcloudTracks,
} from '../../../api/sources/soundcloud';
import {
  addSpotifyTrack,
  fetchMySpotifyTracks,
  fetchSpotifyArtistTracks,
  fetchSpotifyPlaylistTracks,
} from '../../../api/sources/spotify-collection';

export const WIZARD_SERVICES = [
  'soundcloud',
  'hearthis',
  'spotify',
  'mixcloud',
] as const;

export type WizardService = (typeof WIZARD_SERVICES)[number];

export type ImportChoice = {
  id: string;
  kind: 'track' | 'playlist';
  title: string;
  subtitle: string;
  ref: string;
};

export type ImportUnit = {
  service: WizardService;
  title: string;
  ref: string;
};

const SOCIAL_KEY = {
  soundcloud: 'soundcloud',
  hearthis: 'hearthisAt',
  spotify: 'spotify',
  mixcloud: 'mixcloud',
} as const;

export function savedProfile(
  service: WizardService,
  social: SocialConnections,
): string {
  return social[SOCIAL_KEY[service]].trim();
}

export async function loadSocial(): Promise<SocialConnections> {
  const { data } = await fetchSocialConnections();
  return data;
}

export async function serviceReady(
  service: WizardService,
  social: SocialConnections,
): Promise<boolean> {
  if (savedProfile(service, social)) {
    return true;
  }
  if (service === 'soundcloud') {
    const status = await fetchConnectionStatus('soundcloud');
    return Boolean(status.data.connected);
  }
  if (service === 'hearthis') {
    const library = await fetchHearthisLibrary();
    return library.data.tracks.length > 0 || library.data.sets.length > 0;
  }
  if (service === 'spotify') {
    const mine = await fetchMySpotifyTracks();
    return mine.ok && mine.data.length > 0;
  }
  const mine = await fetchMyMixcloudCloudcasts();
  return mine.ok && mine.data.length > 0;
}

function track(
  id: string,
  title: string,
  subtitle: string,
  ref: string,
): ImportChoice {
  return { id, kind: 'track', title, subtitle, ref };
}

function playlist(
  id: string,
  title: string,
  subtitle: string,
  ref: string,
): ImportChoice {
  return { id: `playlist:${id}`, kind: 'playlist', title, subtitle, ref };
}

export async function loadChoices(
  service: WizardService,
  social: SocialConnections,
): Promise<{ choices: ImportChoice[]; needsConnect: boolean }> {
  if (service === 'soundcloud') {
    const [tracks, playlists] = await Promise.all([
      fetchSoundcloudTracks(),
      fetchSoundcloudPlaylists().catch(() => []),
    ]);
    const choices = [
      ...tracks.data.map((item) =>
        track(item.id, item.title, 'SoundCloud', item.id),
      ),
      ...playlists.map((item) =>
        playlist(
          item.id,
          item.title,
          i18n.t('web:library.importWizardTrackCount', {
            count: item.trackCount,
          }),
          item.id,
        ),
      ),
    ];
    return {
      choices,
      needsConnect: Boolean(tracks.needsReconnect) && choices.length === 0,
    };
  }
  if (service === 'hearthis') {
    const library = await fetchHearthisLibrary();
    const own = library.data.tracks.filter((item) => item.kind !== 'DJ-Set');
    const fromProfile = savedProfile(service, social)
      ? (await fetchHearthisArtistTracks(savedProfile(service, social))).data
      : [];
    const seen = new Set<string>();
    const tracks = [...own, ...fromProfile].filter((item) => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
    return {
      choices: [
        ...tracks.map((item) =>
          track(item.url, item.title, item.username, item.url),
        ),
        ...library.data.sets.map((item) =>
          playlist(item.id, item.title, 'hearthis.at', permalinkOf(item)),
        ),
        ...library.data.collections.map((item) =>
          playlist(
            item.id,
            item.title,
            i18n.t('web:library.importWizardTrackCount', {
              count: item.trackCount,
            }),
            item.permalink,
          ),
        ),
      ],
      needsConnect: false,
    };
  }
  if (service === 'spotify') {
    const profile = savedProfile(service, social);
    const mine = await fetchMySpotifyTracks();
    const tracks = mine.ok ? mine.data : [];
    const choices: ImportChoice[] = tracks.map((item) =>
      track(item.uri, item.title, item.artists.join(', '), item.uri),
    );
    if (profile.includes('/playlist/')) {
      const listed = await fetchSpotifyPlaylistTracks(profile);
      if (listed.ok) {
        choices.push(
          playlist(
            profile,
            i18n.t('web:library.importWizardPlaylist'),
            'Spotify',
            profile,
          ),
        );
      }
    } else if (tracks.length === 0 && profile) {
      const listed = await fetchSpotifyArtistTracks(profile);
      if (listed.ok) {
        choices.push(
          ...listed.data.map((item) =>
            track(item.uri, item.title, item.artists.join(', '), item.uri),
          ),
        );
      }
    }
    return { choices, needsConnect: false };
  }
  const profile = savedProfile(service, social);
  const mine = await fetchMyMixcloudCloudcasts();
  const listed =
    mine.ok && mine.data.length > 0
      ? mine
      : profile
        ? await fetchMixcloudProfileCloudcasts(profile)
        : mine;
  return {
    choices: (listed.ok ? listed.data : []).map((item) =>
      track(item.url, item.title, item.displayName, item.url),
    ),
    needsConnect: false,
  };
}

function permalinkOf(item: HearthisTrack): string {
  try {
    const parts = new URL(item.url).pathname.split('/').filter(Boolean);
    return parts.at(-1) || item.id;
  } catch {
    return item.id;
  }
}

export async function expandChoices(
  service: WizardService,
  choices: ImportChoice[],
): Promise<ImportUnit[]> {
  const units: ImportUnit[] = [];
  for (const choice of choices) {
    if (choice.kind === 'track') {
      units.push({ service, title: choice.title, ref: choice.ref });
      continue;
    }
    if (service === 'soundcloud') {
      const tracks = await fetchSoundcloudPlaylistTracks(choice.ref).catch(
        () => [],
      );
      for (const item of tracks) {
        if (!item.download) {
          continue;
        }
        units.push({ service, title: item.title, ref: item.id });
      }
      continue;
    }
    if (service === 'hearthis') {
      const tracks = await fetchHearthisCollectionTracks(choice.ref).catch(
        () => [],
      );
      for (const item of tracks) {
        units.push({ service, title: item.title, ref: item.url });
      }
      continue;
    }
    if (service === 'spotify') {
      const listed = await fetchSpotifyPlaylistTracks(choice.ref);
      if (listed.ok) {
        for (const item of listed.data) {
          units.push({ service, title: item.title, ref: item.uri });
        }
      }
    }
  }
  return units;
}

export async function importOne(
  unit: ImportUnit,
  collectionId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (unit.service === 'soundcloud') {
    return importSoundcloudTracks([{ trackId: unit.ref, title: unit.title }]);
  }
  if (!collectionId) {
    return {
      ok: false,
      error: i18n.t('web:library.importWizardNoCollection'),
    };
  }
  if (unit.service === 'hearthis') {
    const result = await importHearthisTracks(collectionId, [
      {
        id: unit.ref,
        url: unit.ref,
        title: unit.title,
        username: '',
        durationSec: 0,
      },
    ]);
    return result.failed > 0
      ? { ok: false, error: i18n.t('web:library.importWizardImportFailed') }
      : { ok: true };
  }
  if (unit.service === 'spotify') {
    const result = await addSpotifyTrack(collectionId, unit.ref);
    return result.ok ? { ok: true } : result;
  }
  const result = await addMixcloudCloudcast(collectionId, unit.ref);
  return result.ok ? { ok: true } : result;
}
