import { Trash2Icon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, Input, MediaArtwork } from '@tahti-player/ui';

import {
  addMyRadioStation,
  fetchMyRadioStations,
  removeMyRadioStation,
  type MyRadioStation,
} from '../../api/my-radio-stations';
import { PageError } from '../../components/PageStates';
import { usePlayerStore } from '../../stores/playerStore';

const playableId = (station: MyRadioStation) => `radio:my-${station.id}`;

/** The listener's own internet radio stations: add by stream URL, play,
 * remove. Streams play straight from the station, not through Tahti. */
export function MyRadioStations() {
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const [stations, setStations] = useState<MyRadioStation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = () => {
    setFailed(false);
    void fetchMyRadioStations().then((result) => {
      setStations(result.data);
      setFailed(result.data === null);
    });
  };

  useEffect(load, []);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !streamUrl.trim()) {
      return;
    }
    setAdding(true);
    const result = await addMyRadioStation({
      name: name.trim(),
      streamUrl: streamUrl.trim(),
      ...(genre.trim() ? { genre: genre.trim() } : {}),
    });
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStations((current) => [...(current ?? []), result.data]);
    setName('');
    setStreamUrl('');
    setGenre('');
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    const result = await removeMyRadioStation(id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setStations((current) =>
      (current ?? []).filter((station) => station.id !== id),
    );
  };

  if (failed) {
    return <PageError title="Couldn't load your stations" onRetry={load} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {stations && stations.length > 0 ? (
        <ul className="divide-border divide-y" data-testid="my-radio-stations">
          {stations.map((station) => {
            const streamable = station.streamUrl;
            const nowPlaying = [
              station.currentProgramArtist,
              station.currentProgramTitle,
            ]
              .filter(Boolean)
              .join(' – ');
            return (
              <li key={station.id} className="flex items-center gap-3 py-2">
                <MediaArtwork
                  src={station.iconUrl}
                  alt=""
                  size="thumb"
                  playLabel={`Play ${station.name}`}
                  isPlaying={
                    currentId === playableId(station) && status === 'playing'
                  }
                  playDisabled={!streamable}
                  onPlay={() => {
                    if (!streamable) {
                      return;
                    }
                    play({
                      id: playableId(station),
                      kind: 'radio',
                      title: nowPlaying || station.name,
                      artist: station.name,
                      coverUrl: station.iconUrl ?? undefined,
                      streamUrl: streamable,
                      protocol: 'https',
                      sourceProvider: 'internet-radio',
                    });
                  }}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-semibold">
                    {station.name}
                  </span>
                  <span className="text-foreground-secondary block truncate text-xs">
                    {nowPlaying || station.genre || 'Internet radio'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Remove ${station.name}`}
                  disabled={removingId === station.id}
                  onClick={() => void remove(station.id)}
                >
                  <Trash2Icon size={14} aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : stations ? (
        <p className="text-foreground-secondary text-sm">
          No stations yet. Add one with its stream URL.
        </p>
      ) : null}
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => void add(event)}
      >
        <Input
          label="Station name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Stream URL"
          value={streamUrl}
          placeholder="https://stream.example.com/live.mp3"
          onChange={(event) => setStreamUrl(event.target.value)}
        />
        <Input
          label="Genre"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
        />
        <Button
          type="submit"
          className="self-start"
          disabled={adding || !name.trim() || !streamUrl.trim()}
        >
          {adding ? 'Adding…' : 'Add station'}
        </Button>
      </form>
    </div>
  );
}
