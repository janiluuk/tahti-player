import { fetchArtistPlayables } from '../../api/client';
import { fetchSearch } from '../../api/listen';
import { playModeParam, playPlayables, type PlayMode } from './play';
import { McpUserError, type DomainDef } from './types';

const SEARCH_TYPES = ['all', 'tracks', 'artists', 'collections'] as const;

export const tahtiDomain: DomainDef = {
  description:
    'The Tahti catalog: search public tracks, artists and collections, and play an artist.',
  methods: {
    search: {
      description:
        'Search Tahti. Track and artist results link to pages on tahti.live.',
      params: [
        { name: 'query', type: 'string', description: 'What to look for.' },
        {
          name: 'type',
          type: 'string',
          description: 'Limit to one kind of result (default all).',
          optional: true,
          oneOf: SEARCH_TYPES,
        },
      ],
      returns: 'TahtiSearchResult',
      run: async ({ query, type }) => {
        const { data } = await fetchSearch(
          query as string,
          (type as (typeof SEARCH_TYPES)[number] | undefined) ?? 'all',
        );
        return {
          tracks: data.tracks.map((track) => ({
            id: track.id,
            title: track.title,
            artist: track.artistName,
            durationSec: track.durationSec,
          })),
          artists: data.artists.map((artist) => ({
            username: artist.username,
            name: artist.displayName,
          })),
          collections: data.collections.map((collection) => ({
            slug: collection.slug,
            name: collection.name,
            owner: collection.ownerDisplayName,
          })),
        };
      },
    },
    playArtist: {
      description: "Play an artist's public tracks.",
      params: [
        {
          name: 'username',
          type: 'string',
          description: 'An artist username from Tahti.search.',
        },
        playModeParam,
      ],
      returns: 'PlayResult',
      run: async ({ username, mode }) => {
        const { data } = await fetchArtistPlayables(username as string);
        if (data.length === 0) {
          throw new McpUserError(
            `@${String(username)} has no public tracks to play.`,
          );
        }
        return playPlayables(data, mode as PlayMode | undefined);
      },
    },
  },
};
