import {
  disconnectIntegration,
  fetchBandcampAlbums,
  fetchConnectionStatus,
  fetchGoogleDrivePickerConfig,
  fetchSoundcloudTracks,
  importBandcampAlbum,
  importGoogleDriveFiles,
  importSoundcloudTracks,
  oauthStartUrl,
  SOURCE_DEFS,
  type IntegrationId,
} from '../../api/sources';
import { importSourceBase } from './base';
import type {
  BandcampSourceAdapter,
  FallbackOAuthAdapter,
  GoogleDriveSourceAdapter,
  MixcloudSourceAdapter,
  OAuthDisconnectId,
  OAuthSourceAdapter,
  SoundcloudSourceAdapter,
} from './types';

function oauthDef(id: IntegrationId) {
  const def = SOURCE_DEFS.find((source) => source.id === id);
  if (!def || def.kind !== 'oauth' || !def.oauthStartPath) {
    throw new Error(`Missing OAuth source definition: ${id}`);
  }
  return def;
}

function oauthBase(id: Exclude<OAuthDisconnectId, 'musicbrainz'>) {
  const def = oauthDef(id);
  return {
    ...importSourceBase(def),
    kind: 'oauth' as const,
    oauthUrl: oauthStartUrl(def.oauthStartPath!),
    disconnect: () => disconnectIntegration(id),
  };
}

export const bandcampSourceAdapter: BandcampSourceAdapter = {
  ...oauthBase('bandcamp'),
  id: 'bandcamp',
  listAlbums: fetchBandcampAlbums,
  importAlbum: importBandcampAlbum,
};

export const soundcloudSourceAdapter: SoundcloudSourceAdapter = {
  ...oauthBase('soundcloud'),
  id: 'soundcloud',
  listTracks: fetchSoundcloudTracks,
  importTracks: importSoundcloudTracks,
};

export const googleDriveSourceAdapter: GoogleDriveSourceAdapter = {
  ...oauthBase('google-drive'),
  id: 'google-drive',
  pickerConfig: fetchGoogleDrivePickerConfig,
  importFiles: importGoogleDriveFiles,
};

export const mixcloudSourceAdapter: MixcloudSourceAdapter = {
  ...oauthBase('mixcloud'),
  id: 'mixcloud',
};

export const oauthSourceAdapters: OAuthSourceAdapter[] = [
  bandcampSourceAdapter,
  soundcloudSourceAdapter,
  googleDriveSourceAdapter,
  mixcloudSourceAdapter,
];

export function oauthSourceAdapter(
  id: IntegrationId,
): OAuthSourceAdapter | undefined {
  return oauthSourceAdapters.find((adapter) => adapter.id === id);
}

export function oauthAdapterFor(
  id: IntegrationId,
  oauthPath: string,
): OAuthSourceAdapter {
  const existing = oauthSourceAdapter(id);
  if (existing) {
    return existing;
  }
  const fallback: FallbackOAuthAdapter = {
    id: 'musicbrainz',
    name: 'MusicBrainz',
    description: '',
    oauthStartPath: oauthPath,
    kind: 'oauth',
    capabilities: {
      connect: true,
      search: false,
      import: false,
      playback: false,
    },
    oauthUrl: oauthStartUrl(oauthPath),
    checkStatus: () => fetchConnectionStatus(id),
    disconnect: () => disconnectIntegration('musicbrainz'),
  };
  return fallback;
}
