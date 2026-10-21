import {
  playableFromRadioStation,
  searchStations,
  type RadioStation,
} from '../../api/radio-sources';
import {
  RADIO_STATIONS,
  radioStationPlayable,
} from '../../content/radioStations';
import { usePlayerStore } from '../../stores/playerStore';
import { McpUserError, type DomainDef } from './types';

const found = new Map<string, RadioStation>();

export function forgetFoundStations() {
  found.clear();
}

export const radioDomain: DomainDef = {
  description:
    'Radio: the built-in Finnish stations and the radio-browser.info directory of internet radio.',
  methods: {
    stations: {
      description: 'The built-in stations.',
      params: [],
      returns: 'RadioStation[]',
      run: () =>
        RADIO_STATIONS.map((station) => ({
          id: station.id,
          name: station.name,
          language: station.language,
          playable: Boolean(station.streamUrl),
        })),
    },
    search: {
      description: 'Search the internet radio directory by station name.',
      params: [
        {
          name: 'query',
          type: 'string',
          description: 'Part of the station name.',
        },
        {
          name: 'tag',
          type: 'string',
          description: 'A genre tag such as "jazz".',
          optional: true,
        },
      ],
      returns: 'RadioStation[]',
      run: async ({ query, tag }) => {
        const stations = await searchStations({
          name: query as string,
          tags: tag ? [tag as string] : [],
          limit: 20,
        });
        for (const station of stations) {
          found.set(station.id, station);
        }
        return stations.map((station) => ({
          id: station.id,
          name: station.name,
          country: station.country ?? null,
          tags: station.tags ?? [],
          bitrateKbps: station.bitrateKbps ?? null,
        }));
      },
    },
    play: {
      description:
        'Tune in to a built-in station or one found by Radio.search.',
      params: [
        {
          name: 'id',
          type: 'string',
          description: 'A station id from Radio.stations or Radio.search.',
        },
      ],
      returns: 'PlayResult',
      run: ({ id }) => {
        const builtIn = RADIO_STATIONS.find((station) => station.id === id);
        if (builtIn) {
          if (!builtIn.streamUrl) {
            throw new McpUserError(
              `${builtIn.name} has no stream the player can open.`,
            );
          }
          usePlayerStore.getState().play(
            radioStationPlayable({
              ...builtIn,
              streamUrl: builtIn.streamUrl,
            }),
          );
          return { queued: 1 };
        }
        const station = found.get(id as string);
        if (!station) {
          throw new McpUserError(
            `Unknown station "${String(id)}". Use an id from Radio.stations or a recent Radio.search.`,
          );
        }
        usePlayerStore.getState().play(playableFromRadioStation(station));
        return { queued: 1 };
      },
    },
  },
};
