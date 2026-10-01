import {
  addSpotifyTrack,
  fetchHearthisCollectionTracks,
  fetchHearthisLibrary,
  importHearthisTracks,
  searchHearthisTracks,
  searchSpotify,
  SOURCE_DEFS,
  type IntegrationId,
} from '../../api/sources';
import { importSourceBase } from './base';
import type {
  HearthisSourceAdapter,
  SearchSourceAdapter,
  SpotifySourceAdapter,
} from './types';

function searchDef(id: 'spotify' | 'hearthis') {
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

export const searchSourceAdapters: SearchSourceAdapter[] = [
  spotifySourceAdapter,
  hearthisSourceAdapter,
];

export function searchSourceAdapter(
  id: IntegrationId,
): SearchSourceAdapter | undefined {
  return searchSourceAdapters.find((adapter) => adapter.id === id);
}
