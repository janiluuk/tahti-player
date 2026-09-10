import {
  CheckIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PowerIcon,
  RadioTowerIcon,
  SearchIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import {
  addToSelectsRotation,
  fetchAdminSelects,
  removeFromSelectsRotation,
  reorderSelectsRotation,
  searchAdminSelectsBrowse,
  startSelectsStream,
  stopSelectsStream,
  type AdminSelectsBrowseItem,
  type AdminSelectsItem,
  type AdminSelectsStream,
} from '../../../../api/admin';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { TahtiRotationPlaylistEditor } from '../../../../components/TahtiRotationPlaylistEditor';
import { usePlayerStore } from '../../../../stores/playerStore';

function fmtDuration(sec: number | null): string {
  if (!sec) {
    return '—';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Tahti Selects tab — ported as-is from the standalone admin route (see
 * AdminModerationView). Always-on curated rotation, editorial review. */
export function SelectsTab() {
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((state) => state.currentId);
  const playbackStatus = usePlayerStore((state) => state.status);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const [items, setItems] = useState<AdminSelectsItem[]>([]);
  const [stream, setStream] = useState<AdminSelectsStream>({
    state: 'OFFLINE',
    hlsUrl: null,
    nowPlaying: null,
  });
  const [loading, setLoading] = useState(true);
  const [streamBusy, setStreamBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState<AdminSelectsBrowseItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const recoveryAttempted = useRef(false);
  const selectsPlayableId = 'live:tahti-selects';
  const isStreamPlaying =
    currentId === selectsPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const reload = useCallback(() => {
    void fetchAdminSelects().then((res) => {
      setItems(res.data.items);
      setStream(res.data.stream);
      setLoading(false);
    });
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    const intervalId = window.setInterval(reload, 4000);
    return () => window.clearInterval(intervalId);
  }, [reload]);

  useEffect(() => {
    if (
      loading ||
      stream.state !== 'OFFLINE' ||
      items.length === 0 ||
      recoveryAttempted.current
    ) {
      return;
    }
    recoveryAttempted.current = true;
    setStreamBusy(true);
    setStream((current) => ({ ...current, state: 'STARTING' }));
    void startSelectsStream().then((result) => {
      setStreamBusy(false);
      if (!result.ok) {
        setMsg(result.error);
        setStream((current) => ({ ...current, state: 'OFFLINE' }));
        return;
      }
      reload();
    });
  }, [items.length, loading, reload, stream.state]);

  useEffect(() => {
    if (!pickerOpen) {
      setBrowse([]);
      return;
    }
    const handle = setTimeout(() => {
      void searchAdminSelectsBrowse(query).then((res) => setBrowse(res.data));
    }, 250);
    return () => clearTimeout(handle);
  }, [pickerOpen, query]);

  const inRotationIds = new Set(items.map((i) => i.soundId));

  const toggleStreamPlayback = () => {
    if (!stream.hlsUrl) {
      return;
    }
    if (currentId === selectsPlayableId) {
      setPlaybackStatus(isStreamPlaying ? 'paused' : 'playing');
      return;
    }
    play({
      id: selectsPlayableId,
      kind: 'radio',
      title: stream.nowPlaying?.title ?? 'Tahti Selects',
      artist: stream.nowPlaying?.artistName ?? 'Tahti Selects',
      coverUrl: stream.nowPlaying?.artworkUrl ?? undefined,
      streamUrl: stream.hlsUrl,
      protocol: stream.hlsUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: 'tahti-selects',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-foreground-secondary text-sm">
          Always-on curated rotation — loops endlessly. Only public archive
          items can be added.
        </p>
        <Button
          size="sm"
          variant={stream.state === 'LIVE' ? 'secondary' : 'default'}
          disabled={streamBusy}
          onClick={() => {
            const action =
              stream.state === 'LIVE' ? stopSelectsStream : startSelectsStream;
            setStreamBusy(true);
            setStream((current) => ({
              ...current,
              state: current.state === 'LIVE' ? current.state : 'STARTING',
            }));
            void action().then((r) => {
              setStreamBusy(false);
              if (!r.ok) {
                setMsg(r.error);
              } else {
                if (stream.state === 'LIVE') {
                  setStream({
                    state: 'OFFLINE',
                    hlsUrl: null,
                    nowPlaying: null,
                  });
                } else {
                  reload();
                }
              }
            });
          }}
        >
          <PowerIcon size={16} aria-hidden className="mr-1.5" />
          {streamBusy
            ? 'Starting…'
            : stream.state === 'LIVE'
              ? 'Stop stream'
              : 'Bring stream online'}
        </Button>
      </div>

      {msg && (
        <p className="text-foreground-secondary text-sm" role="status">
          {msg}
        </p>
      )}

      <StudioPanel
        title={
          stream.state === 'LIVE'
            ? 'Stream live'
            : stream.state === 'STARTING'
              ? 'Stream starting'
              : 'Stream offline'
        }
        description={
          stream.state === 'LIVE'
            ? 'Tahti Selects is broadcasting the curated rotation.'
            : stream.state === 'STARTING'
              ? 'The rotation service is being brought online.'
              : 'The stream is unavailable. Recovery will be attempted automatically.'
        }
        action={
          stream.state === 'LIVE' && stream.hlsUrl ? (
            <Button
              size="sm"
              aria-label={
                isStreamPlaying
                  ? 'Pause Tahti Selects stream'
                  : 'Play Tahti Selects stream'
              }
              onClick={toggleStreamPlayback}
            >
              {isStreamPlaying ? (
                <PauseIcon size={16} aria-hidden className="mr-1.5" />
              ) : (
                <PlayIcon size={16} aria-hidden className="mr-1.5" />
              )}
              {isStreamPlaying ? 'Pause' : 'Listen'}
            </Button>
          ) : undefined
        }
      >
        <div className="border-border bg-background flex items-center gap-3 rounded-lg border p-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              stream.state === 'LIVE'
                ? 'bg-accent-green/20 text-accent-green'
                : stream.state === 'STARTING'
                  ? 'bg-accent-yellow/20 text-accent-yellow'
                  : 'bg-background-secondary text-foreground-secondary'
            }`}
          >
            <RadioTowerIcon size={20} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
              {stream.state === 'LIVE' ? 'Now playing' : 'Playback state'}
            </p>
            <p className="truncate font-semibold">
              {stream.nowPlaying?.title ??
                (stream.state === 'STARTING'
                  ? 'Connecting rotation…'
                  : 'No active track')}
            </p>
            {stream.nowPlaying ? (
              <p className="text-foreground-secondary truncate text-sm">
                {stream.nowPlaying.artistName}
              </p>
            ) : null}
          </div>
        </div>
      </StudioPanel>

      <StudioPanel
        title={`Current rotation (${items.length})`}
        action={
          <Tooltip content="Add content to rotation" side="top">
            <Button
              size="icon-sm"
              aria-label="Add content to rotation"
              onClick={() => setPickerOpen(true)}
            >
              <PlusIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        }
      >
        {loading ? (
          <PageLoading label="Loading Selects rotation…" />
        ) : items.length === 0 ? (
          <p className="text-foreground-secondary py-4 text-center text-sm">
            Nothing in rotation yet — use the plus button to add tracks.
          </p>
        ) : (
          <TahtiRotationPlaylistEditor
            items={items}
            onPreview={(item) => {
              if (!item.audioUrl) {
                return;
              }
              play({
                id: `sound:${item.soundId}`,
                kind: 'sound',
                title: item.title,
                artist: item.artistName,
                streamUrl: item.audioUrl,
                protocol: item.audioUrl.includes('.m3u8') ? 'hls' : 'https',
                channelSlug: item.channelSlug,
              });
            }}
            onReorder={(next) => {
              const previous = items;
              setItems(next);
              void reorderSelectsRotation(next.map((item) => item.id)).then(
                (result) => {
                  if (!result.ok) {
                    setItems(previous);
                    setMsg(result.error);
                  }
                },
              );
            }}
            onRemove={(item) => {
              void removeFromSelectsRotation(item.id).then((result) => {
                if (!result.ok) {
                  setMsg(result.error);
                } else {
                  reload();
                }
              });
            }}
          />
        )}
      </StudioPanel>

      <Dialog.Root
        isOpen={pickerOpen}
        onClose={() => {
          if (!adding) {
            setPickerOpen(false);
            setSelectedIds(new Set());
          }
        }}
        className="max-w-4xl"
      >
        <Dialog.Title>Add content to Tahti Selects</Dialog.Title>
        <Dialog.Description>
          Browse public, ready archive content. Select one or more tracks, then
          add them to the end of the rotation.
        </Dialog.Description>
        <div className="grid min-h-96 gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
          <nav
            aria-label="Content types"
            className="border-border flex gap-1 overflow-x-auto border-b pb-2 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:pr-3"
          >
            <Button
              variant="tertiary"
              className="justify-start"
              aria-current="page"
            >
              <RadioTowerIcon size={15} aria-hidden className="mr-2" />
              Tracks
            </Button>
            {['Releases', 'Collections', 'Playlists'].map((type) => (
              <Button
                key={type}
                variant="text"
                className="justify-start opacity-50"
                disabled
                title="This content type is not available from the Selects API"
              >
                {type}
              </Button>
            ))}
          </nav>
          <div className="flex min-w-0 flex-col gap-3">
            <Input
              aria-label="Search content"
              placeholder="Search tracks by title…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              endAddon={<SearchIcon size={16} aria-hidden />}
            />
            <div className="border-border min-h-0 overflow-auto rounded-md border">
              {browse.length === 0 ? (
                <p className="text-foreground-secondary p-4 text-sm">
                  {query.trim()
                    ? `No public archive tracks match “${query}”.`
                    : 'No eligible archive tracks found.'}
                </p>
              ) : (
                <ul
                  aria-label="Available tracks"
                  className="divide-border divide-y"
                >
                  {browse.map((item, index) => {
                    const already = inRotationIds.has(item.id);
                    const selected = selectedIds.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${index % 2 === 1 ? 'bg-background-secondary/40' : 'bg-background'}`}
                      >
                        <button
                          type="button"
                          disabled={already}
                          aria-label={`${selected ? 'Deselect' : 'Select'} ${item.title}`}
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedIds((current) => {
                              const next = new Set(current);
                              if (next.has(item.id)) {
                                next.delete(item.id);
                              } else {
                                next.add(item.id);
                              }
                              return next;
                            });
                          }}
                          className={`border-border flex size-5 shrink-0 items-center justify-center rounded border ${selected ? 'bg-primary text-primary-foreground' : 'bg-background'} disabled:opacity-40`}
                        >
                          {selected && <CheckIcon size={13} aria-hidden />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {item.title}
                          </div>
                          <div className="text-foreground-secondary truncate text-xs">
                            {item.artistName} · {fmtDuration(item.durationSec)}{' '}
                            · {item.license}
                          </div>
                        </div>
                        {item.audioUrl ? (
                          <Tooltip content={`Preview ${item.title}`} side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Preview ${item.title}`}
                              onClick={() =>
                                play({
                                  id: `sound:${item.id}`,
                                  kind: 'sound',
                                  title: item.title,
                                  artist: item.artistName,
                                  streamUrl: item.audioUrl!,
                                  protocol: 'https',
                                  channelSlug: item.channelSlug,
                                })
                              }
                            >
                              <PlayIcon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        ) : null}
                        <span className="text-foreground-secondary w-20 text-right text-xs">
                          {already ? 'In rotation' : selected ? 'Selected' : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
        <Dialog.Actions>
          <Button
            className="bg-background-secondary"
            disabled={adding}
            onClick={() => setPickerOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={selectedIds.size === 0 || adding}
            onClick={() => {
              const selected = browse.filter((item) =>
                selectedIds.has(item.id),
              );
              setAdding(true);
              void Promise.all(
                selected.map((item) => addToSelectsRotation(item)),
              ).then((results) => {
                const failed = results.find((result) => !result.ok);
                setAdding(false);
                if (failed && !failed.ok) {
                  setMsg(failed.error);
                  return;
                }
                setPickerOpen(false);
                setSelectedIds(new Set());
                void reload();
              });
            }}
          >
            {adding ? 'Adding…' : `Add ${selectedIds.size || ''} to rotation`}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}
