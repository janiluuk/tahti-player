import { ListPlus, Radio as RadioIcon, SearchIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  FavoriteButton,
  Input,
  MediaArtwork,
  PluginStoreItem,
  Tooltip,
} from '@tahti-player/ui';

import {
  COMMON_STATIONS,
  lookupStationByUrl,
  playableFromRadioStation,
  readIcyStreamTitle,
  resolveStreamUrl,
  searchStationsByName,
  type RadioStation as PublicRadioStation,
} from '../../../api/radio-sources';
import { useLibraryStore } from '../../../stores/libraryStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { ConfigurableCard } from '../shared';

/** "Bring your own stream" — distinct from the curated station directory
 * below it (an admin-approved list for the main player bar): this pastes
 * one personal M3U/direct-stream URL, or searches the public Radio Browser
 * directory, and plays/queues/favorites the result. Ported from the
 * retired Sources page's `radio` tab. */
export function PersonalRadioStreamCard() {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavoriteTrack = useLibraryStore((s) => s.isFavoriteTrack);

  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [station, setStation] = useState<PublicRadioStation | null>(null);
  // undefined = still reading the ICY header, null = unavailable.
  const [nowPlaying, setNowPlaying] = useState<string | null | undefined>(
    undefined,
  );
  const [searching, setSearching] = useState(false);
  const openRequest = useRef(0);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicRadioStation[]>([]);

  const openStation = (next: PublicRadioStation) => {
    const request = ++openRequest.current;
    setStation(next);
    setNowPlaying(undefined);
    setNote(null);
    readIcyStreamTitle(next.streamUrl)
      .then((title) => {
        if (request === openRequest.current) {
          setNowPlaying(title);
        }
      })
      .catch(() => {
        if (request === openRequest.current) {
          setNowPlaying(null);
        }
      });
  };

  const resolveUrl = async () => {
    const input = url.trim();
    if (!input) {
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const { streamUrl, title } = await resolveStreamUrl(input);
      const found = await lookupStationByUrl(streamUrl);
      const next: PublicRadioStation = found ?? {
        id: streamUrl,
        name: title || streamUrl,
        streamUrl,
        source: 'unknown',
      };
      openStation(next);
      if (!found) {
        setNote(
          'Not in the public station directory — playing the stream directly with the name from the playlist, if any.',
        );
      }
    } catch {
      toast.error('Could not resolve that stream URL.');
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    setSearching(true);
    try {
      setResults(await searchStationsByName(query.trim()));
    } catch {
      toast.error('Radio Browser search failed.');
    } finally {
      setSearching(false);
    }
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
          <Button
            size="sm"
            disabled={!url.trim() || busy}
            onClick={() => void resolveUrl()}
          >
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
            onPlay={() =>
              play(playableFromRadioStation(station, nowPlaying ?? null))
            }
            playLabel="Play"
            className="border-border shrink-0 rounded border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{station.name}</div>
            <div className="text-foreground-secondary truncate text-xs">
              {nowPlaying === undefined
                ? '…'
                : nowPlaying
                  ? `Now playing: ${nowPlaying}`
                  : 'Live "now playing" unavailable for this stream'}
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
                enqueue(playableFromRadioStation(station, nowPlaying ?? null))
              }
            >
              <ListPlus size={15} aria-hidden />
            </Button>
          </Tooltip>
          <FavoriteButton
            size="sm"
            isFavorite={isFavoriteTrack(`radio:${station.id}`)}
            onToggle={() =>
              toggleFavoriteTrack(
                playableFromRadioStation(station, nowPlaying ?? null),
              )
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
            disabled={!query.trim() || searching}
            onClick={() => void runSearch()}
          >
            <SearchIcon size={16} aria-hidden className="mr-1.5" />
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </div>
        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {results.map((s) => (
              <li
                key={s.id}
                className="border-border hover:bg-background-secondary flex items-center gap-1 rounded-md border pr-1"
              >
                <Button
                  type="button"
                  variant="text"
                  className="h-auto min-w-0 flex-1 justify-between px-3 py-2 text-left text-sm"
                  onClick={() => openStation(s)}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                    {s.codec}
                    {s.bitrateKbps ? ` ${s.bitrateKbps}kbps` : ''}
                  </span>
                </Button>
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
              <Button
                type="button"
                variant="text"
                className="h-auto min-w-0 flex-1 justify-between px-3 py-2 text-left text-sm"
                onClick={() => openStation(s)}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-foreground-secondary ml-2 shrink-0 text-xs">
                  {s.tags?.[0]}
                </span>
              </Button>
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
