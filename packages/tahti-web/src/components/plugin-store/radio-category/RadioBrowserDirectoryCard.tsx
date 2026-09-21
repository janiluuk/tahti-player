import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  EmptyState,
  FilterChips,
  Input,
  Select,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchCountryList,
  fetchStationCount,
  fetchTagList,
  playableFromRadioStation,
  searchStations,
  type RadioStation as PublicRadioStation,
  type RadioBrowserCountry,
  type RadioBrowserTag,
} from '../../../api/radio-sources';
import {
  RADIO_STATIONS,
  radioStationPlayable,
  type RadioStation,
} from '../../../content/radioStations';
import { flagEmoji } from '../../../lib/countries';
import {
  useListenerWidgetsStore,
  type SavedBrowserStation,
} from '../../../stores/listenerWidgetsStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { useRadioBrowserStore } from '../../../stores/radioBrowserStore';
import { AudioPluginToggleRow, ConfigurableCard } from '../shared';
import { AddStationUrlDialog } from './AddStationUrlDialog';
import { StationDetailsDialog } from './StationDetailsDialog';
import { StationEditDialog } from './StationEditDialog';
import {
  CuratedFinnishStationRow,
  RadioBrowserStationRow,
} from './StationRows';

export function RadioBrowserDirectoryCard() {
  const enabled = useRadioBrowserStore((s) => s.enabled);
  const setEnabled = useRadioBrowserStore((s) => s.setEnabled);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const savedBrowserStations = useListenerWidgetsStore(
    (s) => s.savedBrowserStations,
  );
  const toggleSavedBrowserStation = useListenerWidgetsStore(
    (s) => s.toggleSavedBrowserStation,
  );
  const addSavedBrowserStation = useListenerWidgetsStore(
    (s) => s.addSavedBrowserStation,
  );
  const enabledStationIds = useListenerWidgetsStore((s) => s.enabledStationIds);
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const updateStation = useListenerWidgetsStore((s) => s.updateStation);

  const [loaded, setLoaded] = useState(false);
  const [stationCount, setStationCount] = useState<number | null>(null);
  const [countries, setCountries] = useState<RadioBrowserCountry[]>([]);
  const [tags, setTags] = useState<RadioBrowserTag[]>([]);
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [genresExpanded, setGenresExpanded] = useState(false);
  const [country, setCountry] = useState('');
  const [results, setResults] = useState<PublicRadioStation[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [editingStation, setEditingStation] = useState<RadioStation | null>(
    null,
  );
  const [viewingStation, setViewingStation] =
    useState<SavedBrowserStation | null>(null);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const searchRequest = useRef(0);

  useEffect(() => {
    if (!enabled || loaded) {
      return;
    }
    setLoaded(true);
    fetchStationCount()
      .then(setStationCount)
      .catch(() => undefined);
    fetchCountryList()
      .then(setCountries)
      .catch(() => undefined);
    fetchTagList()
      .then(setTags)
      .catch(() => undefined);
    searchStations({ limit: 20 })
      .then(setResults)
      .catch(() => toast.error('Could not load Radio Browser stations.'));
  }, [enabled, loaded]);

  const runSearch = async () => {
    const request = ++searchRequest.current;
    setSearching(true);
    try {
      const stations = await searchStations({
        name: query,
        tags: genres,
        countryCode: country || undefined,
        limit: 30,
      });
      // Only the newest search may update the list and its "Results" heading.
      if (request === searchRequest.current) {
        setResults(stations);
        setIsFiltered(Boolean(query.trim() || genres.length > 0 || country));
      }
    } catch {
      if (request === searchRequest.current) {
        toast.error('Radio Browser search failed.');
      }
    } finally {
      if (request === searchRequest.current) {
        setSearching(false);
      }
    }
  };

  const browserStationIsPlaying = (station: PublicRadioStation) => {
    const isCurrent = currentId === `radio:${station.id}`;
    return (
      isCurrent &&
      (playbackStatus === 'playing' || playbackStatus === 'loading')
    );
  };
  const playStation = (station: PublicRadioStation) => {
    const isCurrent = currentId === `radio:${station.id}`;
    if (isCurrent) {
      setPlaybackStatus(
        browserStationIsPlaying(station) ? 'paused' : 'playing',
      );
      return;
    }
    play(playableFromRadioStation(station));
  };
  const saveProps = (station: PublicRadioStation) => ({
    isSaved: savedBrowserStations.some((item) => item.id === station.id),
    onToggleSave: () =>
      toggleSavedBrowserStation({
        id: station.id,
        name: station.name,
        streamUrl: station.streamUrl,
        favicon: station.favicon,
        country: station.country,
        homepage: station.homepage,
        countryCode: station.countryCode,
      }),
  });

  const savedStations = savedBrowserStations.filter((station) =>
    Boolean(station.streamUrl),
  );

  const curatedStations = RADIO_STATIONS.map((baseStation) => ({
    ...baseStation,
    ...stationOverrides[baseStation.id],
  })).sort((a, b) => {
    const aEnabled = enabledStationIds.includes(a.id);
    const bEnabled = enabledStationIds.includes(b.id);
    return aEnabled === bEnabled ? 0 : aEnabled ? -1 : 1;
  });

  const genreOptions = tags.slice(0, 24).map((tag) => ({
    id: tag.name,
    label: tag.name,
  }));

  return (
    <>
      <ConfigurableCard
        title="Radio Browser directory"
        dialogClassName="max-w-2xl"
        header={
          <AudioPluginToggleRow
            name="Radio Browser directory"
            author="radio-browser.info · community directory"
            description="Browse and search 50,000+ public internet radio stations, with genre and country filters — Finnish curated stations live under Stations."
            enabled={enabled}
            onToggle={() => setEnabled(!enabled)}
          />
        }
      >
        {!enabled ? (
          <p className="text-foreground-secondary text-sm">
            Activate the add-on to load Radio Browser, then use these tabs to
            search, save, and enable stations.
          </p>
        ) : (
          <Tabs
            items={[
              {
                id: 'stations',
                label: 'Stations',
                content: (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                          Your stations
                        </h3>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setAddUrlOpen(true)}
                        >
                          <PlusIcon size={14} aria-hidden className="mr-1.5" />
                          Add URL
                        </Button>
                      </div>
                      {savedStations.length === 0 ? (
                        <EmptyState
                          size="sm"
                          title="No saved stations yet"
                          description="Save stations from Browser to show them on Listen."
                        />
                      ) : (
                        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {savedStations.map((station) => {
                            const row: PublicRadioStation = {
                              id: station.id,
                              name: station.name,
                              streamUrl: station.streamUrl,
                              favicon: station.favicon,
                              country: station.country,
                              homepage: station.homepage,
                              countryCode: station.countryCode,
                              source: 'unknown',
                            };
                            return (
                              <RadioBrowserStationRow
                                key={station.id}
                                station={row}
                                onPlay={() => playStation(row)}
                                isPlaying={browserStationIsPlaying(row)}
                                onInfo={() => setViewingStation(station)}
                                {...saveProps(row)}
                              />
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        Finnish stations
                      </h3>
                      <ul className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                        {curatedStations.map((station) => {
                          const stationEnabled = enabledStationIds.includes(
                            station.id,
                          );
                          const stationPlayableId = `radio-widget:${station.id}`;
                          const stationIsCurrent =
                            currentId === stationPlayableId;
                          const stationIsPlaying =
                            stationIsCurrent &&
                            (playbackStatus === 'playing' ||
                              playbackStatus === 'loading');
                          const streamUrl = station.streamUrl;
                          return (
                            <CuratedFinnishStationRow
                              key={station.id}
                              station={station}
                              enabled={stationEnabled}
                              onToggleEnable={() => toggleStation(station.id)}
                              onConfigure={() => setEditingStation(station)}
                              isPlaying={stationIsPlaying}
                              onPlay={
                                streamUrl
                                  ? () => {
                                      if (stationIsCurrent) {
                                        setPlaybackStatus(
                                          stationIsPlaying
                                            ? 'paused'
                                            : 'playing',
                                        );
                                        return;
                                      }
                                      play(
                                        radioStationPlayable({
                                          ...station,
                                          streamUrl,
                                        }),
                                      );
                                    }
                                  : null
                              }
                            />
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ),
              },
              {
                id: 'browser',
                label: 'Browser',
                content: (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Input
                        size="sm"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            void runSearch();
                          }
                        }}
                        placeholder="Search stations"
                        aria-label="Search stations"
                        startAddon={
                          <SearchIcon
                            size={14}
                            aria-hidden
                            className="opacity-70"
                          />
                        }
                        endAddon={
                          <Tooltip content="Search" side="top">
                            <button
                              type="button"
                              disabled={searching}
                              onClick={() => void runSearch()}
                              aria-label="Search"
                              className="disabled:opacity-60"
                            >
                              <SearchIcon size={14} aria-hidden />
                            </button>
                          </Tooltip>
                        }
                      />
                      {genreOptions.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="text"
                            className="self-start"
                            onClick={() =>
                              setGenresExpanded((current) => !current)
                            }
                          >
                            {genresExpanded ? 'Hide genres' : 'All genres'}
                          </Button>
                          {genresExpanded || genres.length > 0 ? (
                            <FilterChips
                              multiple
                              items={genreOptions}
                              selected={genres}
                              onChange={setGenres}
                              aria-label="Genres"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <Select
                        className="w-full"
                        options={[
                          { id: '', label: 'All countries' },
                          ...countries.map((entry) => ({
                            id: entry.code,
                            label: `${flagEmoji(entry.code)} ${entry.name} (${entry.stationCount})`,
                          })),
                        ]}
                        value={country}
                        onValueChange={setCountry}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        {isFiltered ? 'Results' : 'Popular stations'}
                        {stationCount
                          ? ` · ${stationCount.toLocaleString()} total`
                          : ''}
                      </h3>
                      {results.length === 0 ? (
                        <EmptyState
                          size="sm"
                          title="No stations found"
                          description="Try another search or clear the filters."
                        />
                      ) : (
                        <ul className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                          {results.map((station) => (
                            <RadioBrowserStationRow
                              key={station.id}
                              station={station}
                              onPlay={() => playStation(station)}
                              isPlaying={browserStationIsPlaying(station)}
                              {...saveProps(station)}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </ConfigurableCard>

      {editingStation && (
        <StationEditDialog
          key={editingStation.id}
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onSave={(patch) => updateStation(editingStation.id, patch)}
        />
      )}
      {addUrlOpen && (
        <AddStationUrlDialog
          onClose={() => setAddUrlOpen(false)}
          onAdd={addSavedBrowserStation}
        />
      )}
      <StationDetailsDialog
        station={viewingStation}
        onClose={() => setViewingStation(null)}
      />
    </>
  );
}
