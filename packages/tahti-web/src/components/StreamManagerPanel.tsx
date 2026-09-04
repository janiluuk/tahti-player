import {
  ActivityIcon,
  BarChart3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Clock3Icon,
  ListMusicIcon,
  MonitorPlayIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RadioIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareIcon,
  TimerIcon,
  UsersIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  StatChip,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchChannelManageStats,
  fetchRtmpTargets,
  fetchSignalStatus,
  pauseChannelRotation,
  postEndBroadcast,
  previousChannelRotation,
  resumeChannelRotation,
  skipChannelRotation,
  type ChannelManageStats,
  type RtmpTarget,
  type SignalStatus,
} from '../api/broadcast';
import { fetchChannel } from '../api/client';
import {
  fetchEditorSource,
  fetchStudioCollection,
  fetchStudioCollections,
  patchStudioSound,
} from '../api/studio';
import {
  fetchProgramme,
  patchProgramme,
  type ProgrammeItem,
  type ProgrammeView,
} from '../api/studio-extras';
import type { StudioCollection } from '../api/studio-types';
import { multicastProviderLabel } from '../plugins/multicast';
import { useBroadcastPresenceStore } from '../stores/broadcastPresenceStore';
import { usePlayerStore } from '../stores/playerStore';
import { ChannelRotationEditor } from './ChannelRotationEditor';
import { StreamOverlayEditor } from './StreamOverlayEditor';

const STATS_POLL_MS = 5000;
const STREAM_POLL_MS = 15000;
const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

type RotationPlayback = {
  title: string;
  artistName: string;
  observedAt: number;
  item: ProgrammeItem | null;
};

function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function StreamManagerPanel({
  slug,
  channelState,
  isPlaying = false,
  onPlaybackToggle,
  onEnded,
  onRotationChange,
  readOnly = false,
  defaultExpanded = false,
}: {
  slug: string;
  channelState: string;
  isPlaying?: boolean;
  onPlaybackToggle?: () => void;
  onEnded?: () => void;
  onRotationChange?: (playing: boolean) => void;
  readOnly?: boolean;
  defaultExpanded?: boolean;
}) {
  const [signal, setSignal] = useState<SignalStatus | null>(null);
  const [stats, setStats] = useState<ChannelManageStats | null>(null);
  const [signalError, setSignalError] = useState(false);
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [rotation, setRotation] = useState<RotationPlayback | null>(null);
  const [rotationPaused, setRotationPaused] = useState(false);
  const rotationTitleRef = useRef<string | null>(null);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [now, setNow] = useState(Date.now());
  const [ending, setEnding] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transportBusy, setTransportBusy] = useState<
    'skip' | 'previous' | 'pause' | 'resume' | null
  >(null);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState('');
  const [selectedCollection, setSelectedCollection] =
    useState<StudioCollection | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [rotationMsg, setRotationMsg] = useState<string | null>(null);
  const [liveStartedAt, setLiveStartedAt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'rotation' | 'stats' | 'overlay'>(
    'rotation',
  );
  // Collapsed by default while the fallback rotation is carrying the
  // station — most visits just want to see what's playing and skip/pause
  // it, not the full stats grid and playlist-add form.
  const [rotationExpanded, setRotationExpanded] = useState(defaultExpanded);
  const canControl = !readOnly;

  useEffect(() => {
    void fetchStudioCollections().then((r) => setCollections(r.data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [signalResult, statsResult] = await Promise.all([
        fetchSignalStatus(),
        fetchChannelManageStats(slug),
      ]);
      if (!cancelled) {
        setSignal(signalResult.data);
        useBroadcastPresenceStore
          .getState()
          .setSignalConnected(Boolean(signalResult.data.connected));
        setStats(statsResult.data);
        setSignalError(
          signalResult.meta.source === 'api' &&
            Boolean(signalResult.meta.reason) &&
            statsResult.data == null,
        );
      }
    };
    void tick();
    const intervalId = window.setInterval(() => void tick(), STATS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const [targetResult, programmeResult, channel] = await Promise.all([
        fetchRtmpTargets(),
        fetchProgramme(),
        fetchChannel(slug)
          .then((result) => result.data)
          .catch(() => null),
      ]);
      if (cancelled) {
        return;
      }
      setTargets(targetResult.data.filter((target) => target.enabled));
      setProgramme(programmeResult.data);
      const nowPlaying = channel?.nowPlaying;
      if (!nowPlaying) {
        setRotation(null);
        setRotationPaused(false);
        rotationTitleRef.current = null;
        return;
      }
      if (rotationTitleRef.current !== nowPlaying.title) {
        setRotationPaused(false);
        rotationTitleRef.current = nowPlaying.title;
      }
      const item =
        programmeResult.data.items.find(
          (candidate) => candidate.title === nowPlaying.title,
        ) ?? null;
      setRotation((current) =>
        current?.title === nowPlaying.title
          ? { ...current, artistName: nowPlaying.artistName, item }
          : {
              title: nowPlaying.title,
              artistName: nowPlaying.artistName,
              observedAt: Date.now(),
              item,
            },
      );
    };
    void tick();
    const intervalId = window.setInterval(() => void tick(), STREAM_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [slug]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), SECOND_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const signalConnected = stats?.signalConnected ?? signal?.connected ?? false;
  const liveActive = channelState === 'LIVE' || signalConnected;

  useEffect(() => {
    if (liveActive) {
      setLiveStartedAt((startedAt) => startedAt ?? Date.now());
    } else {
      setLiveStartedAt(null);
    }
  }, [liveActive]);

  const liveDurationSec =
    stats?.liveDurationSec ??
    (liveActive && liveStartedAt !== null
      ? Math.max(0, Math.floor((now - liveStartedAt) / SECOND_MS))
      : null);
  const rotationPlaying =
    Boolean(rotation) && !signalConnected && !rotationPaused;

  useEffect(() => {
    onRotationChange?.(rotationPlaying);
  }, [onRotationChange, rotationPlaying]);

  const bitrate = stats?.audioBitrateKbps ?? signal?.bitrateKbps;
  const listeners = stats?.listeners ?? signal?.listeners;
  const outputLabel = signalConnected
    ? 'Live broadcast'
    : rotationPlaying
      ? 'Track rotation'
      : channelState === 'LIVE'
        ? 'Live output'
        : 'Offline';
  const playerState = signalConnected
    ? 'Live'
    : rotationPlaying
      ? 'Playing'
      : rotation
        ? 'Paused'
        : 'Stopped';
  const durationSec = rotation?.item?.durationSec ?? null;
  const elapsedSinceObserved = rotation
    ? Math.floor((now - rotation.observedAt) / SECOND_MS)
    : 0;
  const remainingSec =
    durationSec == null
      ? null
      : Math.max(0, durationSec - elapsedSinceObserved);

  const editableRotation = useMemo(
    () =>
      (programme?.items ?? [])
        .filter((item) => item.isFallback)
        .sort(
          (left, right) =>
            (left.fallbackOrder ?? 0) - (right.fallbackOrder ?? 0),
        ),
    [programme],
  );
  const availableRotationItems = useMemo(
    () =>
      (programme?.items ?? []).filter(
        (item) => item.status === 'READY' && !item.isFallback,
      ),
    [programme],
  );

  const handleTransport = async (
    action: 'skip' | 'previous' | 'pause' | 'resume',
  ) => {
    setTransportBusy(action);
    setError(null);
    const fn = {
      skip: skipChannelRotation,
      previous: previousChannelRotation,
      pause: pauseChannelRotation,
      resume: resumeChannelRotation,
    }[action];
    const result = await fn(slug);
    setTransportBusy(null);
    if (!result.ok) {
      setError(result.error);
    } else if (action === 'pause' || action === 'resume') {
      setRotationPaused(action === 'pause');
    }
  };

  const openPlaylistDialog = () => {
    setPlaylistDialogOpen(true);
    if (!selectedCollectionSlug && collections[0]) {
      setSelectedCollectionSlug(collections[0].slug);
      void previewCollection(collections[0].slug);
    }
  };

  const previewCollection = async (collectionSlug: string) => {
    setSelectedCollectionSlug(collectionSlug);
    setPlaylistLoading(true);
    const { data: collection } = await fetchStudioCollection(collectionSlug);
    setSelectedCollection(collection);
    setPlaylistLoading(false);
  };

  const handleApplyCollectionToRotation = async (replace: boolean) => {
    if (!selectedCollectionSlug) {
      return;
    }
    setRotationBusy(true);
    setRotationMsg(null);
    const collection =
      selectedCollection?.slug === selectedCollectionSlug
        ? selectedCollection
        : (await fetchStudioCollection(selectedCollectionSlug)).data;
    const soundIds = (collection?.items ?? [])
      .map((item) => item.soundId)
      .filter((id): id is string => Boolean(id));
    if (replace && programme) {
      for (const item of editableRotation) {
        await patchStudioSound(item.id, { isFallback: false });
      }
    }
    let added = 0;
    let failed = 0;
    for (const soundId of soundIds) {
      const result = await patchStudioSound(soundId, {
        isFallback: true,
      });
      if (result.ok) {
        added++;
      } else {
        failed++;
      }
    }
    setRotationBusy(false);
    setRotationMsg(
      failed > 0
        ? `${replace ? 'Replaced with' : 'Added'} ${added} track${added === 1 ? '' : 's'} — ${failed} could not be added.`
        : added === 0
          ? 'Nothing to add — that playlist has no tracks.'
          : `${replace ? 'Replaced rotation with' : 'Added'} ${added} track${added === 1 ? '' : 's'}${replace ? '' : ' to the rotation'}.`,
    );
    setPlaylistDialogOpen(false);
  };

  const saveEditableRotation = async (nextRotation: ProgrammeItem[]) => {
    if (!programme) {
      return;
    }
    setRotationBusy(true);
    setRotationMsg(null);
    const positions = new Map(
      nextRotation.map((item, index) => [item.id, index]),
    );
    const result = await patchProgramme({
      fallbackMode: programme.fallbackMode,
      fallbackEnabled: programme.fallbackEnabled,
      fallbackAutoEnroll: programme.fallbackAutoEnroll,
      announcementsEnabled: programme.announcementsEnabled,
      items: programme.items.map((item) => {
        const position = positions.get(item.id);
        return {
          soundId: item.id,
          isFallback: position !== undefined,
          ...(position !== undefined ? { fallbackOrder: position } : {}),
        };
      }),
    });
    setRotationBusy(false);
    if (!result.ok) {
      setRotationMsg(result.error);
      return;
    }
    setProgramme(result.data);
    setRotationMsg('Rotation updated.');
  };

  const addRotationItem = async (item: ProgrammeItem) => {
    await saveEditableRotation([...editableRotation, item]);
  };

  const play = usePlayerStore((state) => state.play);
  const previewCurrentId = usePlayerStore((state) => state.currentId);
  const previewStatus = usePlayerStore((state) => state.status);
  const previewItemId = previewCurrentId?.startsWith('archive:')
    ? previewCurrentId.slice('archive:'.length)
    : null;
  const previewPlaying = previewStatus === 'playing';
  const rotationCurrentId = rotationPlaying
    ? (rotation?.item?.id ?? null)
    : previewItemId;
  const rotationEditorPlaying = rotationPlaying ? true : previewPlaying;

  const previewRotationItem = async (item: ProgrammeItem) => {
    const { data } = await fetchEditorSource(item.id);
    play({
      id: `archive:${item.id}`,
      kind: 'archive',
      title: item.title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
  };

  const handleEnd = async () => {
    setEnding(true);
    setError(null);
    const result = await postEndBroadcast();
    setEnding(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onEnded?.();
  };

  return (
    <section className="border-border bg-background-secondary/40 flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="order-1 min-w-0 flex-1">
          <div className="font-display flex items-center gap-2 text-sm font-bold tracking-tight sm:text-base">
            {rotationPlaying ? (
              <ListMusicIcon size={18} className="text-primary" aria-hidden />
            ) : (
              <RadioIcon size={18} className="text-primary" aria-hidden />
            )}
            Stream playlist manager
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1.5"
              role="status"
              aria-label={`Player state: ${playerState}`}
            >
              {playerState === 'Live' || playerState === 'Playing' ? (
                <Badge variant="dot" color="green" animated />
              ) : null}
              <Badge
                variant="pill"
                color={
                  playerState === 'Live' || playerState === 'Playing'
                    ? 'green'
                    : 'secondary'
                }
                className="tracking-wide uppercase"
              >
                {playerState}
              </Badge>
            </span>
            <span className="text-foreground-secondary">{outputLabel}</span>
          </div>
        </div>
        {canControl && !signalConnected && (
          <div
            className="order-3 flex w-full shrink-0 items-center justify-center gap-2 sm:order-2 sm:w-auto"
            role="group"
            aria-label="Rotation controls"
          >
            <Tooltip content="Previous track" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={transportBusy !== null}
                onClick={() => void handleTransport('previous')}
                aria-label="Previous track"
              >
                <SkipBackIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip
              content={rotationPlaying ? 'Stop rotation' : 'Start rotation'}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                intent="danger"
                disabled={transportBusy !== null}
                onClick={() =>
                  void handleTransport(rotationPlaying ? 'pause' : 'resume')
                }
                aria-label={
                  rotationPlaying ? 'Stop rotation' : 'Start rotation'
                }
              >
                {rotationPlaying ? (
                  <SquareIcon size={14} aria-hidden className="fill-current" />
                ) : (
                  <PlayIcon size={14} aria-hidden />
                )}
              </Button>
            </Tooltip>
            <Tooltip content="Skip track" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={transportBusy !== null}
                onClick={() => void handleTransport('skip')}
                aria-label="Skip track"
              >
                <SkipForwardIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </div>
        )}
        <div className="order-2 min-w-0 flex-1 text-right sm:order-3">
          <p className="text-foreground-secondary text-[10px] font-semibold tracking-wide uppercase">
            Current track
          </p>
          {rotation ? (
            <>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {rotation.title}
              </p>
              <p className="text-foreground-secondary truncate text-xs">
                {rotation.artistName}
                {durationSec != null
                  ? ` · ${formatRemaining(Math.min(elapsedSinceObserved, durationSec))} / ${formatRemaining(durationSec)}`
                  : ''}
              </p>
            </>
          ) : (
            <p className="text-foreground-secondary mt-0.5 text-sm">
              No track playing
            </p>
          )}
        </div>
        <div className="order-4 flex shrink-0 items-center gap-2">
          {canControl && collections.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={openPlaylistDialog}
              aria-label="Choose playlist"
              title="Choose playlist"
            >
              <PlusIcon size={14} aria-hidden />
              Playlist
            </Button>
          )}
          {rotationPlaying && (
            <Tooltip
              content={rotationExpanded ? 'Show less' : 'Show more'}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={() => setRotationExpanded((v) => !v)}
                aria-label={rotationExpanded ? 'Show less' : 'Show more'}
                aria-expanded={rotationExpanded}
              >
                {rotationExpanded ? (
                  <ChevronDownIcon size={15} aria-hidden />
                ) : (
                  <ChevronRightIcon size={15} aria-hidden />
                )}
              </Button>
            </Tooltip>
          )}
          {canControl && onPlaybackToggle && (
            <Tooltip
              content={isPlaying ? 'Pause stream' : 'Play stream'}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={onPlaybackToggle}
                aria-label={isPlaying ? 'Pause stream' : 'Play stream'}
              >
                {isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
              </Button>
            </Tooltip>
          )}
          {canControl && signalConnected && (
            <Button
              size="sm"
              variant="text"
              disabled={ending}
              onClick={() => setConfirmEndOpen(true)}
            >
              <SquareIcon
                size={14}
                className="mr-1.5 fill-current"
                aria-hidden
              />
              {ending ? 'Ending…' : 'End stream'}
            </Button>
          )}
        </div>
      </div>

      {rotationMsg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {rotationMsg}
        </p>
      )}

      {(!rotationPlaying || rotationExpanded) && (
        <Tabs.Root
          selectedIndex={
            activeTab === 'rotation' ? 0 : activeTab === 'stats' ? 1 : 2
          }
          onChange={(index) =>
            setActiveTab(
              index === 0 ? 'rotation' : index === 1 ? 'stats' : 'overlay',
            )
          }
        >
          <Tabs.List>
            <Tabs.Tab>
              <TabLabel icon={<ListMusicIcon size={14} />}>
                Active rotation
              </TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<BarChart3Icon size={14} />}>
                Stream stats
              </TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<MonitorPlayIcon size={14} />}>Overlay</TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      )}

      {activeTab === 'stats' && (!rotationPlaying || rotationExpanded) && (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          role="group"
          aria-label="Live stream status"
        >
          <StatChip
            icon={
              rotationPlaying ? (
                <ListMusicIcon size={14} aria-hidden />
              ) : (
                <RadioIcon size={14} aria-hidden />
              )
            }
            label="Output"
            value={outputLabel}
          />
          <StatChip
            icon={
              signalConnected ? (
                <WifiIcon size={14} className="text-primary" aria-hidden />
              ) : (
                <WifiOffIcon size={14} aria-hidden />
              )
            }
            label="Signal"
            value={
              signal == null && stats == null
                ? '—'
                : signalConnected
                  ? 'Connected'
                  : signalError
                    ? 'Unavailable'
                    : rotationPlaying
                      ? 'Rotation'
                      : 'No encoder'
            }
          />
          <StatChip
            icon={<ActivityIcon size={14} aria-hidden />}
            label="Bitrate"
            value={
              bitrate != null
                ? `${bitrate} kbps`
                : rotationPlaying
                  ? 'N/A — rotation'
                  : liveActive
                    ? 'Detecting…'
                    : '—'
            }
          />
          <StatChip
            icon={<Clock3Icon size={14} aria-hidden />}
            label="Time left"
            value={
              rotationPlaying
                ? remainingSec != null
                  ? `≤ ${formatRemaining(remainingSec)}`
                  : 'Unknown'
                : '—'
            }
          />
          <StatChip
            icon={<UsersIcon size={14} aria-hidden />}
            label="Listeners"
            value={
              listeners == null && stats?.listenerPeak == null
                ? '—'
                : `${listeners ?? 0} / ${stats?.listenerPeak ?? 0}`
            }
          />
          <StatChip
            icon={<TimerIcon size={14} aria-hidden />}
            label="Live for"
            value={
              liveDurationSec != null
                ? formatRemaining(liveDurationSec)
                : liveActive
                  ? 'Starting…'
                  : '—'
            }
          />
        </div>
      )}

      {activeTab === 'rotation' && (
        <>
          {canControl && signalConnected && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={ending}
                onClick={() => setConfirmEndOpen(true)}
                className="self-start"
              >
                <SquareIcon
                  size={14}
                  className="mr-1.5 fill-current"
                  aria-hidden
                />
                {ending ? 'Ending…' : 'Stop stream'}
              </Button>
            </div>
          )}
          {canControl &&
            (!rotationPlaying || rotationExpanded) &&
            programme && (
              <ChannelRotationEditor
                items={editableRotation}
                availableItems={availableRotationItems}
                busy={rotationBusy}
                currentItemId={rotationCurrentId}
                isPlaying={rotationEditorPlaying}
                onAdd={(item) => void addRotationItem(item)}
                onReorder={(next) => void saveEditableRotation(next)}
                onRemove={(item) =>
                  void saveEditableRotation(
                    editableRotation.filter(
                      (candidate) => candidate.id !== item.id,
                    ),
                  )
                }
                onPlay={(item) => void previewRotationItem(item)}
              />
            )}

          {(!rotationPlaying || rotationExpanded) && targets.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {targets.map((target) => (
                <li
                  key={target.id}
                  className="border-border flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm"
                >
                  <span>
                    {target.label || multicastProviderLabel(target.provider)}
                  </span>
                  <span className="text-foreground-secondary text-xs uppercase">
                    Mirroring
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === 'overlay' && canControl && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-display text-base font-bold">Stream overlay</h3>
          </div>
          <StreamOverlayEditor onSaved={() => setActiveTab('rotation')} />
        </div>
      )}

      {error && <p className="text-accent-red text-xs">{error}</p>}

      {canControl ? (
        <>
          <Dialog.Root
            isOpen={playlistDialogOpen}
            onClose={() => setPlaylistDialogOpen(false)}
          >
            <Dialog.Title>Choose a playlist</Dialog.Title>
            <Dialog.Description>
              Preview a playlist, then add it to the rotation or replace the
              current rotation with it.
            </Dialog.Description>
            <div className="grid gap-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
              <div className="border-border flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
                {collections.map((collection) => (
                  <button
                    key={collection.slug}
                    type="button"
                    className={`rounded-md px-3 py-2 text-left text-sm ${
                      selectedCollectionSlug === collection.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-background-secondary'
                    }`}
                    onClick={() => void previewCollection(collection.slug)}
                  >
                    <span className="block truncate font-semibold">
                      {collection.name}
                    </span>
                    <span className="block text-xs opacity-75">
                      {collection.itemCount ?? collection.items?.length ?? 0}{' '}
                      tracks
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-border min-h-32 rounded-lg border p-3">
                {playlistLoading ? (
                  <p className="text-foreground-secondary text-sm">
                    Loading playlist…
                  </p>
                ) : selectedCollection ? (
                  <>
                    <h3 className="font-semibold">{selectedCollection.name}</h3>
                    <ul className="text-foreground-secondary mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                      {(selectedCollection.items ?? []).map((item) => (
                        <li key={item.id} className="truncate">
                          {item.position + 1}.{' '}
                          {item.sound?.title ??
                            item.release?.title ??
                            'Untitled track'}
                        </li>
                      ))}
                    </ul>
                    {(selectedCollection.items ?? []).length === 0 && (
                      <p className="text-foreground-secondary mt-2 text-xs">
                        This playlist has no tracks.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground-secondary text-sm">
                    Choose a playlist to preview it.
                  </p>
                )}
              </div>
            </div>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                variant="secondary"
                disabled={
                  !selectedCollectionSlug || playlistLoading || rotationBusy
                }
                onClick={() => void handleApplyCollectionToRotation(false)}
              >
                {rotationBusy ? 'Adding…' : 'Add to rotation'}
              </Button>
              <Button
                disabled={
                  !selectedCollectionSlug || playlistLoading || rotationBusy
                }
                onClick={() => void handleApplyCollectionToRotation(true)}
              >
                Replace rotation
              </Button>
            </Dialog.Actions>
          </Dialog.Root>
          <Dialog.Root
            isOpen={confirmEndOpen}
            onClose={() => setConfirmEndOpen(false)}
          >
            <Dialog.Title>Stop your live stream?</Dialog.Title>
            <Dialog.Description>
              Listeners will hear the 24/7 rotation instead. You can go live
              again any time.
            </Dialog.Description>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                disabled={ending}
                onClick={() => {
                  setConfirmEndOpen(false);
                  void handleEnd();
                }}
              >
                {ending ? 'Ending…' : 'Stop stream'}
              </Button>
            </Dialog.Actions>
          </Dialog.Root>
        </>
      ) : null}
    </section>
  );
}
