import {
  ListPlus,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  Radio as RadioIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  FavoriteButton,
  FilterChips,
  ImageReveal,
  Input,
  MediaArtwork,
  PluginStoreItem,
  SaveButton,
  Select,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  COMMON_STATIONS,
  fetchCountryList,
  fetchStationCount,
  fetchTagList,
  lookupStationByUrl,
  playableFromRadioStation,
  readIcyStreamTitle,
  resolveStreamUrl,
  searchStations,
  searchStationsByName,
  testRadioStream,
  type RadioStation as PublicRadioStation,
  type RadioBrowserCountry,
  type RadioBrowserTag,
  type RadioStreamTestResult,
} from '../../api/radio-sources';
import {
  RADIO_STATIONS,
  radioStationPlayable,
  type RadioStation,
} from '../../content/radioStations';
import { flagEmoji } from '../../lib/countries';
import { useLibraryStore } from '../../stores/libraryStore';
import { useListenerWidgetsStore } from '../../stores/listenerWidgetsStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useRadioBrowserStore } from '../../stores/radioBrowserStore';
import { RadioStationCover } from '../RadioStationCover';
import { AudioPluginToggleRow, ConfigurableCard } from './shared';

/** "Bring your own stream" — distinct from the curated station directory
 * below it (an admin-approved list for the main player bar): this pastes
 * one personal M3U/direct-stream URL, or searches the public Radio Browser
 * directory, and plays/queues/favorites the result. Ported from the
 * retired Sources page's `radio` tab. */
function PersonalRadioStreamCard() {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [station, setStation] = useState<PublicRadioStation | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicRadioStation[]>([]);

  const openStation = (next: PublicRadioStation) => {
    setStation(next);
    setNowPlaying(null);
    setNote(null);
    void readIcyStreamTitle(next.streamUrl).then(setNowPlaying);
  };

  const resolveUrl = () => {
    const input = url.trim();
    if (!input) {
      return;
    }
    setBusy(true);
    setNote(null);
    void resolveStreamUrl(input).then(async ({ streamUrl, title }) => {
      const found = await lookupStationByUrl(streamUrl);
      setBusy(false);
      const next: PublicRadioStation = found ?? {
        id: streamUrl,
        name: title || streamUrl,
        streamUrl,
        source: 'unknown',
      };
      if (!found) {
        setNote(
          'Not in the public station directory — playing the stream directly with the name from the playlist, if any.',
        );
      }
      openStation(next);
    });
  };

  return (
    <ConfigurableCard
      title="Personal radio stream"
      dialogClassName="max-w-2xl"
      header={(open) => (
        <PluginStoreItem
          name="Personal radio stream"
          author="Radio Browser · stream URL"
          description="Paste an M3U/M3U8 playlist or a direct stream URL, or search the public Radio Browser directory — plays via the main player, separate from curated Finnish stations in Radio Browser → Stations."
          categories={station !== null ? ['Configured'] : undefined}
          isInstalled={station !== null}
          onInstall={open}
          labels={{ install: 'Open', installed: 'Ready' }}
        />
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="text-foreground-secondary text-sm">
          Station metadata is looked up in the public Radio Browser directory;
          live "now playing" is read from the stream's ICY metadata when the
          server allows it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-0 flex-1 basis-48"
            size="sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/stream.m3u8"
          />
          <Button size="sm" disabled={!url.trim() || busy} onClick={resolveUrl}>
            <RadioIcon size={16} aria-hidden className="mr-1.5" />
            {busy ? 'Resolving…' : 'Resolve'}
          </Button>
        </div>
        {note && <p className="text-foreground-secondary text-xs">{note}</p>}
      </div>

      {station && (
        <div className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3">
          <MediaArtwork
            size="thumb"
            src={station.favicon}
            alt={station.name}
            imageReveal={false}
            onPlay={() => play(playableFromRadioStation(station, nowPlaying))}
            playLabel="Play"
            className="border-border shrink-0 rounded border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{station.name}</div>
            <div className="text-foreground-secondary truncate text-xs">
              {nowPlaying
                ? `Now playing: ${nowPlaying}`
                : nowPlaying === null
                  ? 'Live "now playing" unavailable for this stream'
                  : '…'}
            </div>
            {station.tags && station.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {station.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="pill" color="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Tooltip content="Queue" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={`Queue ${station.name}`}
              onClick={() =>
                enqueue(playableFromRadioStation(station, nowPlaying))
              }
            >
              <ListPlus size={15} aria-hidden />
            </Button>
          </Tooltip>
          <FavoriteButton
            size="sm"
            isFavorite={isFavoriteTrack(`radio:${station.id}`)}
            onToggle={() =>
              toggleFavoriteTrack(playableFromRadioStation(station, nowPlaying))
            }
            ariaLabelAdd={`Favorite ${station.name}`}
            ariaLabelRemove={`Unfavorite ${station.name}`}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-bold tracking-wide uppercase">
          Search the public directory
        </h3>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-0 flex-1 basis-40"
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Station name"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void searchStationsByName(query.trim()).then(setResults);
            }}
          >
            <SearchIcon size={16} aria-hidden className="mr-1.5" />
            Search
          </Button>
        </div>
        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {results.map((s) => (
              <li
                key={s.id}
                className="border-border hover:bg-background-secondary flex items-center gap-1 rounded-md border pr-1"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left text-sm"
                  onClick={() => openStation(s)}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                    {s.codec}
                    {s.bitrateKbps ? ` ${s.bitrateKbps}kbps` : ''}
                  </span>
                </button>
                <FavoriteButton
                  size="sm"
                  isFavorite={isFavoriteTrack(`radio:${s.id}`)}
                  onToggle={() =>
                    toggleFavoriteTrack(playableFromRadioStation(s))
                  }
                  ariaLabelAdd={`Add ${s.name} to library`}
                  ariaLabelRemove={`Remove ${s.name} from library`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-bold tracking-wide uppercase">
          Common stations
        </h3>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {COMMON_STATIONS.map((s) => (
            <li
              key={s.id}
              className="border-border hover:bg-background-secondary flex items-center gap-1 rounded-md border pr-1"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left text-sm"
                onClick={() => openStation(s)}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                  {s.tags?.[0]}
                </span>
              </button>
              <FavoriteButton
                size="sm"
                isFavorite={isFavoriteTrack(`radio:${s.id}`)}
                onToggle={() =>
                  toggleFavoriteTrack(playableFromRadioStation(s))
                }
                ariaLabelAdd={`Add ${s.name} to library`}
                ariaLabelRemove={`Remove ${s.name} from library`}
              />
            </li>
          ))}
        </ul>
      </div>
    </ConfigurableCard>
  );
}

function RadioBrowserStationRow({
  station,
  onPlay,
  isSaved,
  onToggleSave,
}: {
  station: PublicRadioStation;
  onPlay: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <div className="border-border bg-background flex size-9 shrink-0 items-center justify-center overflow-hidden rounded border">
        <ImageReveal
          src={station.favicon ?? undefined}
          alt=""
          className="size-full"
          imgClassName="object-contain"
          placeholder={
            <RadioIcon
              size={16}
              className="text-foreground-secondary"
              aria-hidden
            />
          }
        />
      </div>
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col items-start text-left"
        onClick={onPlay}
      >
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.country ?? station.tags?.[0] ?? 'Unknown'}
        </span>
      </button>
      <Tooltip content={`Play ${station.name}`} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label={`Play ${station.name}`}
          onClick={onPlay}
        >
          <PlayIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <SaveButton
        size="sm"
        label={isSaved ? 'Saved' : 'Save'}
        onClick={onToggleSave}
        aria-label={
          isSaved
            ? `Remove ${station.name} from Listen`
            : `Save ${station.name} to Listen`
        }
      />
    </li>
  );
}

function CuratedFinnishStationRow({
  station,
  enabled,
  onToggleEnable,
  onConfigure,
  onPlay,
  isPlaying,
}: {
  station: RadioStation;
  enabled: boolean;
  onToggleEnable: () => void;
  onConfigure: () => void;
  onPlay: (() => void) | null;
  isPlaying: boolean;
}) {
  const sourceConfigured = Boolean(station.streamUrl);
  return (
    <li className="border-border hover:bg-background-secondary flex items-center gap-2 rounded-md border p-1.5 pr-1">
      <RadioStationCover
        src={station.logoUrl}
        label={station.name}
        stationName={station.name}
        catalogStationId={station.id}
        className="h-9 w-9 shrink-0 overflow-hidden rounded border"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="w-full truncate text-sm">{station.name}</span>
        <span className="text-foreground-secondary w-full truncate text-xs">
          {station.genre} · {station.bitrateKbps}kbps {station.codec}
          {sourceConfigured ? '' : ' · Needs source'}
        </span>
      </div>
      {onPlay ? (
        <Tooltip content={isPlaying ? 'Pause' : 'Preview'} side="top">
          <Button
            type="button"
            size="icon-sm"
            variant={isPlaying ? undefined : 'secondary'}
            aria-label={
              isPlaying ? `Pause ${station.name}` : `Preview ${station.name}`
            }
            aria-pressed={isPlaying}
            onClick={onPlay}
          >
            {isPlaying ? (
              <PauseIcon size={14} aria-hidden />
            ) : (
              <PlayIcon size={14} aria-hidden />
            )}
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content="Configure station" side="top">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={`Configure ${station.name}`}
          onClick={onConfigure}
        >
          <SettingsIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip
        content={enabled ? `Disable ${station.name}` : `Enable ${station.name}`}
        side="top"
      >
        <Button
          type="button"
          size="icon-sm"
          variant={enabled ? 'default' : 'secondary'}
          aria-label={
            enabled ? `Disable ${station.name}` : `Enable ${station.name}`
          }
          aria-pressed={enabled}
          onClick={onToggleEnable}
        >
          <PowerIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </li>
  );
}

function RadioBrowserDirectoryCard() {
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
  const [logoUrlDraft, setLogoUrlDraft] = useState('');
  const [streamUrlDraft, setStreamUrlDraft] = useState('');
  const [streamTestBusy, setStreamTestBusy] = useState(false);
  const [streamTestResult, setStreamTestResult] =
    useState<RadioStreamTestResult | null>(null);

  useEffect(() => {
    if (!enabled || loaded) {
      return;
    }
    setLoaded(true);
    void fetchStationCount().then(setStationCount);
    void fetchCountryList().then(setCountries);
    void fetchTagList().then(setTags);
    void searchStations({ limit: 20 }).then(setResults);
  }, [enabled, loaded]);

  useEffect(() => {
    setLogoUrlDraft(editingStation?.logoUrl ?? '');
    setStreamUrlDraft(editingStation?.streamUrl ?? '');
    setStreamTestBusy(false);
    setStreamTestResult(null);
  }, [editingStation]);

  const runSearch = () => {
    setSearching(true);
    setIsFiltered(Boolean(query.trim() || genres.length > 0 || country));
    void searchStations({
      name: query,
      tags: genres,
      countryCode: country || undefined,
      limit: 30,
    }).then((stations) => {
      setResults(stations);
      setSearching(false);
    });
  };

  const playStation = (station: PublicRadioStation) =>
    play(playableFromRadioStation(station));
  const saveProps = (station: PublicRadioStation) => ({
    isSaved: savedBrowserStations.some((item) => item.id === station.id),
    onToggleSave: () =>
      toggleSavedBrowserStation({
        id: station.id,
        name: station.name,
        streamUrl: station.streamUrl,
        favicon: station.favicon,
        country: station.country,
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
                      <h3 className="font-display text-sm font-bold tracking-wide uppercase">
                        Your stations
                      </h3>
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
                              source: 'unknown',
                            };
                            return (
                              <RadioBrowserStationRow
                                key={station.id}
                                station={row}
                                onPlay={() => playStation(row)}
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
                            runSearch();
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
                              onClick={runSearch}
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
                          <button
                            type="button"
                            className="text-foreground-secondary hover:text-foreground self-start text-xs font-medium underline-offset-2 hover:underline"
                            onClick={() =>
                              setGenresExpanded((current) => !current)
                            }
                          >
                            {genresExpanded ? 'Hide genres' : 'All genres'}
                          </button>
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

      <Dialog.Root
        isOpen={editingStation !== null}
        onClose={() => setEditingStation(null)}
        className="max-w-lg"
      >
        {editingStation && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateStation(editingStation.id, {
                name: String(form.get('name') ?? '').trim(),
                language: String(form.get('language') ?? '').trim(),
                genre: String(form.get('genre') ?? '').trim(),
                bitrateKbps: Number(form.get('bitrateKbps') ?? 0),
                codec: String(form.get('codec') ?? '').trim(),
                logoUrl: String(form.get('logoUrl') ?? '').trim(),
                streamUrl: streamUrlDraft.trim() || null,
                detailUrl: String(form.get('detailUrl') ?? '').trim(),
              });
              setEditingStation(null);
            }}
          >
            <Dialog.Title>Edit {editingStation.name}</Dialog.Title>
            <Dialog.Description>
              Update the station metadata, cover image, and programming source.
            </Dialog.Description>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                name="name"
                label="Station name"
                defaultValue={editingStation.name}
              />
              <Input
                name="language"
                label="Language"
                defaultValue={editingStation.language}
              />
              <Input
                name="genre"
                label="Genre"
                defaultValue={editingStation.genre}
              />
              <Input
                name="bitrateKbps"
                label="Bitrate (kbps)"
                defaultValue={String(editingStation.bitrateKbps)}
                inputMode="numeric"
              />
              <Input
                name="codec"
                label="Codec"
                defaultValue={editingStation.codec}
              />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium">Cover image</span>
                <RadioStationCover
                  src={logoUrlDraft}
                  label={editingStation.name}
                  stationName={editingStation.name}
                  catalogStationId={editingStation.id}
                  className="h-28 w-28 overflow-hidden rounded-lg"
                  onCoverChange={setLogoUrlDraft}
                />
                <input type="hidden" name="logoUrl" value={logoUrlDraft} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Input
                  name="streamUrl"
                  label="Programming source / stream URL"
                  value={streamUrlDraft}
                  onChange={(e) => {
                    setStreamUrlDraft(e.target.value);
                    setStreamTestResult(null);
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!streamUrlDraft.trim() || streamTestBusy}
                    onClick={() => {
                      setStreamTestBusy(true);
                      setStreamTestResult(null);
                      void testRadioStream(streamUrlDraft.trim()).then(
                        (result) => {
                          setStreamTestBusy(false);
                          setStreamTestResult(result);
                        },
                      );
                    }}
                  >
                    {streamTestBusy ? 'Testing…' : 'Test stream'}
                  </Button>
                  {streamTestResult && (
                    <p
                      className={`text-xs ${streamTestResult.ok ? 'text-accent-green' : 'text-foreground-secondary'}`}
                    >
                      {streamTestResult.ok ? '✓ ' : ''}
                      {streamTestResult.message}
                    </p>
                  )}
                </div>
              </div>
              <Input
                name="detailUrl"
                label="Station details URL"
                defaultValue={editingStation.detailUrl}
                className="sm:col-span-2"
              />
            </div>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <SaveButton type="submit" label="Save station" />
            </Dialog.Actions>
          </form>
        )}
      </Dialog.Root>
    </>
  );
}

export function RadioCategory() {
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestLogoUrl, setSuggestLogoUrl] = useState('');
  const [suggestLanguage, setSuggestLanguage] = useState('');
  const [suggestBitrate, setSuggestBitrate] = useState('');
  const [suggestStreamUrl, setSuggestStreamUrl] = useState('');
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <PersonalRadioStreamCard />
      <RadioBrowserDirectoryCard />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSuggestOpen((v) => !v)}
        >
          {suggestOpen ? 'Cancel' : 'Suggest a station'}
        </Button>
      </div>

      {suggestOpen && (
        <form
          className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-lg border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSuggestBusy(true);
            setSuggestMsg(null);
            void import('../../api/admin')
              .then(({ submitRadioStationSuggestion }) =>
                submitRadioStationSuggestion({
                  name: suggestName.trim(),
                  logoUrl: suggestLogoUrl.trim(),
                  language: suggestLanguage.trim(),
                  bitrateKbps: suggestBitrate.trim(),
                  streamUrl: suggestStreamUrl.trim(),
                }),
              )
              .then((r) => {
                setSuggestBusy(false);
                if (!r.ok) {
                  setSuggestMsg(r.error);
                  return;
                }
                setSuggestMsg('Thanks — sent to the Tahti team for review.');
                setSuggestName('');
                setSuggestLogoUrl('');
                setSuggestLanguage('');
                setSuggestBitrate('');
                setSuggestStreamUrl('');
              });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Station name"
              value={suggestName}
              onChange={(e) => setSuggestName(e.target.value)}
              required
            />
            <Input
              label="Language"
              value={suggestLanguage}
              onChange={(e) => setSuggestLanguage(e.target.value)}
              placeholder="Finnish"
            />
            <Input
              label="Bitrate (kbps)"
              value={suggestBitrate}
              onChange={(e) => setSuggestBitrate(e.target.value)}
              placeholder="128"
            />
            <Input
              label="Logo URL"
              value={suggestLogoUrl}
              onChange={(e) => setSuggestLogoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label="Stream URL"
              value={suggestStreamUrl}
              onChange={(e) => setSuggestStreamUrl(e.target.value)}
              placeholder="https://stream.example.fi/station.mp3"
              className="sm:col-span-2"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              type="submit"
              disabled={
                suggestBusy || !suggestName.trim() || !suggestStreamUrl.trim()
              }
            >
              {suggestBusy ? 'Sending…' : 'Send for review'}
            </Button>
            {suggestMsg && (
              <p className="text-foreground-secondary text-xs">{suggestMsg}</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
