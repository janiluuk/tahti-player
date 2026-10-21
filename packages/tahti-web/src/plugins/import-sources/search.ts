import {
  addMixcloudCloudcast,
  addSpotifyTrack,
  fetchHearthisCollectionTracks,
  fetchHearthisLibrary,
  importHearthisTracks,
  searchHearthisTracks,
  searchMixcloud,
  searchSpotify,
  SOURCE_DEFS,
  type IntegrationId,
} from '../../api/sources';
import { importSourceBase } from './base';
import type {
  HearthisSourceAdapter,
  MixcloudEmbedSourceAdapter,
  SearchSourceAdapter,
  SpotifySourceAdapter,
} from './types';

function searchDef(id: 'spotify' | 'hearthis' | 'mixcloud-embed') {
  const def = SOURCE_DEFS.find((source) => source.id === id);
  if (!def || def.kind !== 'search') {
    throw new Error(`Missing search source definition: ${id}`);
  }
  return def;
}

export const spotifySourceAdapter: SpotifySourceAdapter = {
  ...importSourceBase(searchDef('spotify')),
  kind: 'search',
  id: 'spotify',
  search: searchSpotify,
  addToCollection: addSpotifyTrack,
};

export const hearthisSourceAdapter: HearthisSourceAdapter = {
  ...importSourceBase(searchDef('hearthis')),
  kind: 'search',
  id: 'hearthis',
  search: searchHearthisTracks,
  library: fetchHearthisLibrary,
  collectionTracks: fetchHearthisCollectionTracks,
  importTracks: importHearthisTracks,
};

export const mixcloudEmbedSourceAdapter: MixcloudEmbedSourceAdapter = {
  ...importSourceBase(searchDef('mixcloud-embed')),
  kind: 'search',
  id: 'mixcloud-embed',
  search: searchMixcloud,
  addToCollection: addMixcloudCloudcast,
};

export const searchSourceAdapters: SearchSourceAdapter[] = [
  spotifySourceAdapter,
  hearthisSourceAdapter,
  mixcloudEmbedSourceAdapter,
];

export function searchSourceAdapter(
  id: IntegrationId,
): SearchSourceAdapter | undefined {
  return searchSourceAdapters.find((adapter) => adapter.id === id);
}
