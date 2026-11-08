import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, MediaArtwork } from '@tahti-player/ui';

import {
  addMyRadioStation,
  fetchMyRadioStations,
  removeMyRadioStation,
  type MyRadioStation,
} from '../../api/my-radio-stations';
import { PageEmpty, PageError } from '../../components/PageStates';
import { toastWithUndo } from '../../lib/undoToast';
import { usePlayerStore } from '../../stores/playerStore';

const playableId = (station: MyRadioStation) => `radio:my-${station.id}`;

/** The listener's own internet radio stations: add by stream URL, play,
 * remove. Streams play straight from the station, not through Tahti. */
export function MyRadioStations({
  onChange,
}: {
  onChange?: (stations: MyRadioStation[]) => void;
} = {}) {
  const { t } = useTranslation('web');
  const nameInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (stations) {
      onChange?.(stations);
    }
  }, [onChange, stations]);

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
    const created = result.data;
    setStations((current) => [...(current ?? []), created]);
    setName('');
    setStreamUrl('');
    setGenre('');
    toastWithUndo(`Added ${created.name}.`, {
      undo: () => removeMyRadioStation(created.id),
      undoneMessage: `Removed ${created.name}.`,
      onUndone: () =>
        setStations((current) =>
          (current ?? []).filter((station) => station.id !== created.id),
        ),
    });
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
    return (
      <PageError
        title={t('loadErrors.couldnTLoadYourStations')}
        onRetry={load}
      />
    );
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
                  <Trash2Icon
                    className="text-accent-red"
                    size={14}
                    aria-hidden
                  />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : stations ? (
        <PageEmpty
          title={t('empties.noRadioStations')}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => nameInputRef.current?.focus()}
            >
              <PlusIcon size={16} aria-hidden />
              {t('emptyActions.addStation')}
            </Button>
          }
        />
      ) : null}
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => void add(event)}
      >
        <Input
          ref={nameInputRef}
          label="Station name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
