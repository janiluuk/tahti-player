import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArchiveIcon,
  AudioLinesIcon,
  BarChart3Icon,
  GaugeIcon,
  ListMusicIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  RadioTowerIcon,
  SaveIcon,
  ScissorsIcon,
  SparklesIcon,
  TagsIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Alert,
  Button,
  CreatableCombobox,
  Input,
  Select,
  Tabs,
  Textarea,
  Toggle,
  Tooltip,
  TrackContextMenu,
} from '@tahti-player/ui';

import {
  fetchEditorDraft,
  fetchEditorSource,
  fetchStudioSound,
  patchStudioSound,
  renderEditorDraft,
} from '../../api/studio';
import {
  createDefaultEditList,
  type EditList,
  type StudioSound,
} from '../../api/studio-types';
import { AddToPlaylistPanel } from '../../components/AddToPlaylistPanel';
import {
  AudienceVisibilitySection,
  type TrackVisibility,
} from '../../components/AudienceVisibilitySection';
import { AudioRevisionList } from '../../components/AudioRevisionList';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader } from '../../components/StudioPanel';
import { WaveformSeekbar } from '../../components/tahti/WaveformSeekbar';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';
import { SELECTABLE_CONTENT_TYPES } from '../../content/contentTypes';
import { autoTrimCuts } from '../../lib/autoTrimCuts';
import { capitalizeGenre, PRESET_GENRES } from '../../lib/genres';
import { isPinned } from '../../lib/pinnedTracks';
import { playableFromStudioHearthis } from '../../lib/embedPlayback';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
} from '../../lib/embedSrc';
import { useMasteringFeatureStore } from '../../plugins/mastering/store';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

export function StudioSoundView({ id }: { id: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const currentId = usePlayerStore((state) => state.currentId);
  const playerStatus = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const playerDuration = usePlayerStore((state) => state.duration);
  const play = usePlayerStore((state) => state.play);
  const setPlayerStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const [item, setItem] = useState<StudioSound | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [contentType, setContentType] = useState('TRACK');
  const [visibility, setVisibility] = useState<TrackVisibility>('PUBLIC');
  const [fanTierIds, setFanTierIds] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState('');
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [tab, setTab] = useState<'details' | 'playlists' | 'insights'>(
    'details',
  );
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);

  const [editList, setEditList] = useState<EditList | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [quickBusy, setQuickBusy] = useState<'normalize' | 'trim' | null>(null);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);
  const [revisionTick, setRevisionTick] = useState(0);

  useEffect(() => {
    void fetchStudioSound(id).then((res) => {
      setItem(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description ?? '');
      setGenre(res.data.genre ? capitalizeGenre(res.data.genre) : '');
      setContentType(res.data.contentType ?? 'TRACK');
      setVisibility(
        res.data.visibility ??
          (res.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      );
      setFanTierIds(res.data.fanTierIds ?? []);
      setReleaseDate(res.data.releaseDate ?? '');
      setDownloadsEnabled(res.data.downloadsEnabled ?? false);
      setCommentsEnabled(res.data.commentsEnabled ?? true);
    });
    void fetchEditorDraft(id).then((res) => {
      setEditList(res.data.editList);
      const level = res.data.editorPeaks?.levels?.[0];
      setPeaks(level && level.length > 0 ? level : []);
    });
  }, [id]);

  useEffect(() => {
    if (contentType === 'CLIP' && tab === 'playlists') {
      setTab('details');
    }
  }, [contentType, tab]);

  const status = item?.status;
  // Landing here straight from Upload (see StudioUploadView), or a refresh /
  // bookmark of this URL, both need this page to make sense before the file
  // has finished transcoding — poll until it leaves PENDING/PROCESSING
  // rather than silently showing a half-broken "ready" editor.
  useEffect(() => {
    if (!status || status === 'READY' || status === 'ERROR') {
      return;
    }
    const timer = setInterval(() => {
      void fetchStudioSound(id).then((res) => setItem(res.data));
    }, 4000);
    return () => clearInterval(timer);
  }, [id, status]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = await patchStudioSound(id, {
      title,
      description,
      ...(isAudioClip ? { genre: null } : { genre: genre || null }),
      contentType,
      isPublic: visibility === 'PUBLIC',
      visibility,
      fanTierIds,
      ...(isAudioClip
        ? { releaseDate: null }
        : { releaseDate: releaseDate || null }),
      downloadsEnabled,
      commentsEnabled,
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setItem(result.data);
    setMessage('Saved.');
  };

  const togglePin = async () => {
    if (!item) {
      return;
    }
    const next = !isPinned(item);
    setMessage(null);
    setPinBusy(true);
    const result = await patchStudioSound(id, { pinned: next });
    setPinBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setItem(result.data);
    setMessage(next ? 'Pinned to your public page.' : 'Unpinned.');
  };

  const toggleRotation = async () => {
    if (!item) {
      return;
    }
    const next = !item.isFallback;
    setRotationBusy(true);
    setMessage(null);
    const result = await patchStudioSound(id, { isFallback: next });
    setRotationBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setItem(result.data);
    setMessage(
      next ? 'Added to your 24/7 rotation.' : 'Removed from rotation.',
    );
  };

  const moveToStash = async () => {
    setSaving(true);
    const result = await patchStudioSound(id, {
      visibility: 'PRIVATE',
      isPublic: false,
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setItem(result.data);
    setVisibility('PRIVATE');
    setMessage('Moved to your private stash.');
  };

  const startPlayback = async (startAt?: number) => {
    if (!item) {
      return;
    }
    const playableId = `archive:${id}`;
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      if (currentId === playableId) {
        setPlayerStatus('playing');
        return;
      }
      play(hearthis);
      return;
    }
    if (item.embedProvider) {
      return;
    }
    if (currentId === playableId) {
      if (startAt !== undefined) {
        seekTo(startAt);
      }
      setPlayerStatus('playing');
      return;
    }
    setPlayBusy(true);
    const { data } = await fetchEditorSource(id);
    play({
      id: playableId,
      kind: 'archive',
      title: item.title,
      artist: item.artistName || user?.displayName || 'You',
      coverUrl: item.bannerUrl ?? undefined,
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
    if (startAt !== undefined) {
      seekTo(startAt);
    }
    setPlayBusy(false);
  };

  const runQuickRender = async (
    kind: 'normalize' | 'trim',
    next: EditList,
    label: string,
  ) => {
    setQuickBusy(kind);
    setQuickMsg(null);
    const result = await renderEditorDraft(id, next, label);
    setQuickBusy(null);
    if (!result.ok) {
      setQuickMsg(result.error);
      return;
    }
    setEditList(next);
    setQuickMsg(
      `Queued as version — the previous version stays available below.`,
    );
    setRevisionTick((tick) => tick + 1);
  };

  const onNormalize = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    void runQuickRender(
      'normalize',
      { ...base, loudnorm: { ...base.loudnorm, enabled: true } },
      'Quick normalize',
    );
  };

  const onAutoTrim = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    const cuts = autoTrimCuts(peaks, base.sourceDuration);
    if (cuts.length === 0) {
      setQuickMsg('No leading/trailing silence detected.');
      return;
    }
    void runQuickRender(
      'trim',
      { ...base, cuts: [...base.cuts, ...cuts] },
      'Quick auto-trim',
    );
  };

  const visibilityLabel = item
    ? (item.visibility ?? (item.isPublic === false ? 'PRIVATE' : 'PUBLIC'))
        .charAt(0)
        .concat(
          (item.visibility ?? (item.isPublic === false ? 'PRIVATE' : 'PUBLIC'))
            .slice(1)
            .toLowerCase(),
        )
    : '';
  const isAudioClip = contentType === 'CLIP';
  const pinned = item ? isPinned(item) : false;
  const hasError = status === 'ERROR';
  const notReady = status != null && status !== 'READY' && !hasError;
  const isCurrent = currentId === `archive:${id}`;
  const isPlaying =
    isCurrent && (playerStatus === 'playing' || playerStatus === 'loading');

  return (
    <StudioGate>
      <div className="studio-page-layout studio-page-layout--fixed-width mx-auto flex max-w-4xl flex-col gap-6">
        <StudioNav current={`/studio/sounds/${id}`} />
        <Link
          to="/studio/sounds"
          className="text-foreground-secondary text-xs hover:underline"
        >
          ← Music
        </Link>
        {!item ? (
          <PageLoading label="Loading…" />
        ) : (
          <>
            <header className="border-border bg-background-secondary/30 overflow-hidden rounded-xl border">
              <div className="relative min-h-72 overflow-hidden">
                {item.bannerUrl ? (
                  <img
                    src={item.bannerUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="bg-background-secondary absolute inset-0 flex items-center justify-center">
                    <AudioLinesIcon
                      size={56}
                      aria-hidden
                      className="text-foreground-secondary"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
                <Tooltip
                  content={isPlaying ? 'Pause track' : 'Play track'}
                  side="top"
                >
                  <Button
                    size="icon"
                    className="absolute top-5 left-5 size-14 rounded-full shadow-xl"
                    disabled={playBusy || notReady || hasError}
                    aria-label={isPlaying ? 'Pause track' : 'Play track'}
                    onClick={() => {
                      if (isPlaying) {
                        setPlayerStatus('paused');
                      } else {
                        void startPlayback();
                      }
                    }}
                  >
                    {isPlaying ? (
                      <PauseIcon size={24} aria-hidden />
                    ) : (
                      <PlayIcon size={24} aria-hidden />
                    )}
                  </Button>
                </Tooltip>
                <div className="absolute right-5 bottom-5 left-5 text-white">
                  <StudioPageHeader
                    title={item.title}
                    subtitle={`Edit title, description, and visibility. ${item.status}, ${visibilityLabel}${pinned ? ', Pinned' : ''}`}
                  />
                  <div className="mt-5">
                    <WaveformSeekbar
                      trackId={id}
                      peaks={peaks}
                      progress={
                        isCurrent && playerDuration > 0
                          ? currentTime / playerDuration
                          : 0
                      }
                      className="h-14"
                      playedColor="#ffffff"
                      unplayedColor="rgba(255,255,255,0.35)"
                      onSeek={(fraction) =>
                        void startPlayback(
                          fraction *
                            (editList?.sourceDuration ?? item.durationSec ?? 0),
                        )
                      }
                    />
                    <div className="mt-1 flex justify-between text-xs text-white/70 tabular-nums">
                      <span>
                        {isCurrent
                          ? `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`
                          : '0:00'}
                      </span>
                      <span>
                        {Math.floor(
                          (editList?.sourceDuration ?? item.durationSec ?? 0) /
                            60,
                        )}
                        :
                        {String(
                          Math.floor(
                            (editList?.sourceDuration ??
                              item.durationSec ??
                              0) % 60,
                          ),
                        ).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-border flex flex-wrap items-center gap-2 border-t p-3">
                <Tooltip
                  content={pinned ? 'Unpin from page' : 'Pin to page'}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    disabled={pinBusy}
                    onClick={() => void togglePin()}
                    aria-label={pinned ? 'Unpin from page' : 'Pin to page'}
                  >
                    {pinned ? (
                      <PinOffIcon size={16} aria-hidden />
                    ) : (
                      <PinIcon size={16} aria-hidden />
                    )}
                  </Button>
                </Tooltip>
                {tab === 'details' ? (
                  <Tooltip content="Save changes" side="top">
                    <Button
                      size="icon-sm"
                      disabled={!title.trim() || saving}
                      onClick={() => void save()}
                      aria-label="Save changes"
                    >
                      <SaveIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                ) : null}
                <span className="bg-border mx-1 h-5 w-px" aria-hidden />
                <TrackContextMenu>
                  <TrackContextMenu.Trigger>
                    <Tooltip content="Quick edits" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={notReady || hasError}
                        aria-label="Quick edits"
                      >
                        <MoreHorizontalIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                  </TrackContextMenu.Trigger>
                  <TrackContextMenu.Content>
                    <TrackContextMenu.Header title="Quick edits" />
                    <TrackContextMenu.Action
                      disabled={quickBusy !== null}
                      onClick={onNormalize}
                      icon={<GaugeIcon size={16} aria-hidden />}
                    >
                      {quickBusy === 'normalize'
                        ? 'Normalizing…'
                        : 'Normalize audio'}
                    </TrackContextMenu.Action>
                    <TrackContextMenu.Action
                      disabled={quickBusy !== null}
                      onClick={onAutoTrim}
                      icon={<ScissorsIcon size={16} aria-hidden />}
                    >
                      {quickBusy === 'trim'
                        ? 'Trimming silence…'
                        : 'Trim silence'}
                    </TrackContextMenu.Action>
                    {masteringEnabled && (
                      <TrackContextMenu.Action
                        onClick={() =>
                          void navigate({
                            to: '/studio/mastering/$id',
                            params: { id },
                          })
                        }
                        icon={<SparklesIcon size={16} aria-hidden />}
                      >
                        Master
                      </TrackContextMenu.Action>
                    )}
                  </TrackContextMenu.Content>
                </TrackContextMenu>
                <Tooltip content="Open audio editor" side="top">
                  <Link to="/studio/sounds/$id/editor" params={{ id }}>
                    <Button
                      size="icon-sm"
                      variant="text"
                      disabled={notReady || hasError}
                      aria-label="Open audio editor"
                    >
                      <AudioLinesIcon size={16} aria-hidden />
                    </Button>
                  </Link>
                </Tooltip>
              </div>
            </header>

            {notReady && (
              <Alert tone="neutral" aria-live="polite">
                Still processing — this can take a minute for longer files.
                Playback, the waveform, and quick fixes will unlock once it's
                ready; metadata below is safe to edit and save now.
              </Alert>
            )}

            {hasError && (
              <Alert tone="error">
                Processing failed for this file. Try uploading it again, or
                contact support if it keeps happening.
              </Alert>
            )}

            {message && (
              <p className="text-foreground-secondary text-sm">{message}</p>
            )}

            <Tabs
              selectedIndex={
                tab === 'details' ? 0 : tab === 'playlists' ? 1 : 2
              }
              onChange={(index) =>
                setTab(
                  index === 0
                    ? 'details'
                    : index === 1
                      ? 'playlists'
                      : 'insights',
                )
              }
              items={[
                {
                  id: 'details',
                  label: 'Details',
                  icon: <TagsIcon size={15} />,
                  content: (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                        />
                        <Select
                          label="Content type"
                          value={contentType}
                          onValueChange={setContentType}
                          options={SELECTABLE_CONTENT_TYPES.map(
                            ({ id, label }) => ({ id, label }),
                          )}
                        />
                        <div className="sm:col-span-2">
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-foreground-secondary text-xs uppercase">
                              Description
                            </span>
                            <Textarea
                              tone="secondary"
                              value={description}
                              onChange={(event) =>
                                setDescription(event.target.value)
                              }
                              rows={4}
                            />
                          </label>
                        </div>
                        {!isAudioClip ? (
                          <>
                            <Input
                              type="date"
                              label="Release date"
                              value={releaseDate}
                              onChange={(event) =>
                                setReleaseDate(event.target.value)
                              }
                            />
                            <CreatableCombobox
                              label="Genre"
                              options={[...PRESET_GENRES]}
                              value={genre}
                              onValueChange={setGenre}
                              normalize={capitalizeGenre}
                            />
                          </>
                        ) : null}
                        <AudienceVisibilitySection
                          visibility={visibility}
                          onVisibilityChange={setVisibility}
                          tierIds={fanTierIds}
                          onTierIdsChange={setFanTierIds}
                        />
                        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                          <span>
                            <span className="block font-medium">
                              Allow downloads
                            </span>
                            <span className="text-foreground-secondary block text-xs">
                              Listeners can download the released audio file.
                            </span>
                          </span>
                          <Toggle
                            label="Allow downloads"
                            checked={downloadsEnabled}
                            onChange={setDownloadsEnabled}
                          />
                        </div>
                        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                          <span>
                            <span className="block font-medium">
                              Allow comments
                            </span>
                            <span className="text-foreground-secondary block text-xs">
                              Listeners can discuss this track on its public
                              page.
                            </span>
                          </span>
                          <Toggle
                            label="Allow comments"
                            checked={commentsEnabled}
                            onChange={setCommentsEnabled}
                          />
                        </div>
                      </div>

                      {quickMsg && (
                        <p className="text-foreground-secondary mt-4 text-xs">
                          {quickMsg}
                        </p>
                      )}

                      <AudioRevisionList
                        soundId={id}
                        trackTitle={title || item.title}
                        artistName={
                          item.artistName || user?.displayName || 'You'
                        }
                        coverUrl={item.bannerUrl}
                        reloadToken={revisionTick}
                      />
                    </>
                  ),
                },
                ...(!isAudioClip
                  ? [
                      {
                        id: 'playlists' as const,
                        label: 'Playlists',
                        icon: <ListMusicIcon size={15} />,
                        content: (
                          <section className="border-border bg-background-secondary/30 flex flex-col gap-5 rounded-xl border p-5">
                            <div className="flex items-start gap-3">
                              <ListMusicIcon
                                size={28}
                                className="text-primary shrink-0"
                                aria-hidden
                              />
                              <div>
                                <h2 className="font-semibold">
                                  Add to playlists
                                </h2>
                                <p className="text-foreground-secondary text-sm">
                                  Add this track to one or more playlists, or
                                  create a new playlist without leaving the
                                  track page.
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="self-start"
                              onClick={() => setPlaylistOpen(true)}
                            >
                              <ListMusicIcon
                                size={15}
                                aria-hidden
                                className="mr-1.5"
                              />
                              Choose playlists
                            </Button>
                            <div className="border-border grid gap-3 border-t pt-4 sm:grid-cols-2">
                              {!isAudioClip ? (
                                <Button
                                  variant={
                                    item.isFallback ? 'secondary' : 'text'
                                  }
                                  disabled={rotationBusy}
                                  onClick={() => void toggleRotation()}
                                  aria-pressed={item.isFallback}
                                >
                                  <RadioTowerIcon
                                    size={16}
                                    aria-hidden
                                    className="mr-1.5"
                                  />
                                  {item.isFallback
                                    ? 'Remove from rotation'
                                    : 'Add to rotation'}
                                </Button>
                              ) : null}
                              <Button
                                variant="text"
                                disabled={saving || visibility === 'PRIVATE'}
                                onClick={() => void moveToStash()}
                              >
                                <ArchiveIcon
                                  size={16}
                                  aria-hidden
                                  className="mr-1.5"
                                />
                                Move to private stash
                              </Button>
                            </div>
                          </section>
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'insights',
                  label: 'Insights',
                  icon: <BarChart3Icon size={15} />,
                  content: <TrackInsightsPanel kind="sound" id={id} />,
                },
              ]}
            />
          </>
        )}
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          soundId={id}
          trackTitle={item?.title ?? title}
          onClose={() => setPlaylistOpen(false)}
        />
      </div>
    </StudioGate>
  );
}
