import { Link } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  BarChart3Icon,
  ListMusicIcon,
  PauseIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  RadioTowerIcon,
  SaveIcon,
  TagsIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, CreatableCombobox, Input } from '@nuclearplayer/ui';

import {
  activateArchiveVersion,
  fetchArchiveVersions,
  fetchVersionDownloadUrl,
  type ArchiveVersion,
} from '../../api/archive-versions';
import {
  fetchEditorDraft,
  fetchEditorSource,
  fetchStudioArchive,
  fetchStudioArchiveItem,
  patchStudioArchiveItem,
  renderEditorDraft,
} from '../../api/studio';
import {
  createDefaultEditList,
  type EditList,
  type StudioArchiveItem,
} from '../../api/studio-types';
import { AddToPlaylistPanel } from '../../components/AddToPlaylistPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { WaveformCanvas } from '../../components/WaveformCanvas';
import { capitalizeGenre, PRESET_GENRES } from '../../lib/genres';
import {
  countPinnedTracks,
  isPinned,
  MAX_PINNED_TRACKS,
  pinBlockedMessage,
} from '../../lib/pinnedTracks';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

const SILENCE_THRESHOLD = 0.06;
const MIN_TRIM_SEC = 0.5;

/** Finds leading/trailing near-silent regions from downsampled peaks and
 * returns cut regions to remove them — a client-side heuristic, not true
 * silence detection, since only bucketed peaks (not raw audio) are available. */
function autoTrimCuts(peaks: number[], durationSec: number): EditList['cuts'] {
  if (peaks.length === 0 || durationSec <= 0) {
    return [];
  }
  let lead = 0;
  while (lead < peaks.length && peaks[lead]! < SILENCE_THRESHOLD) {
    lead++;
  }
  let trail = peaks.length - 1;
  while (trail >= 0 && peaks[trail]! < SILENCE_THRESHOLD) {
    trail--;
  }
  const cuts: EditList['cuts'] = [];
  const leadSec = (lead / peaks.length) * durationSec;
  const trailSec = ((trail + 1) / peaks.length) * durationSec;
  if (leadSec >= MIN_TRIM_SEC) {
    cuts.push({ start: 0, end: leadSec });
  }
  if (durationSec - trailSec >= MIN_TRIM_SEC) {
    cuts.push({ start: trailSec, end: durationSec });
  }
  return cuts;
}

export function StudioArchiveItemView({ id }: { id: string }) {
  const user = useAuthStore((state) => state.user);
  const currentId = usePlayerStore((state) => state.currentId);
  const playerStatus = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const playerDuration = usePlayerStore((state) => state.duration);
  const play = usePlayerStore((state) => state.play);
  const setPlayerStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const [item, setItem] = useState<StudioArchiveItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  >('PUBLIC');
  const [releaseDate, setReleaseDate] = useState('');
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [tab, setTab] = useState<'details' | 'playlists'>('details');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);

  const [editList, setEditList] = useState<EditList | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [quickBusy, setQuickBusy] = useState<'normalize' | 'trim' | null>(null);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);
  const [versions, setVersions] = useState<ArchiveVersion[]>([]);
  const [versionBusy, setVersionBusy] = useState<string | null>(null);

  const reloadVersions = () => {
    void fetchArchiveVersions(id).then((r) => setVersions(r.data));
  };

  useEffect(() => {
    void fetchStudioArchiveItem(id).then((res) => {
      setItem(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description ?? '');
      setGenre(res.data.genre ? capitalizeGenre(res.data.genre) : '');
      setVisibility(
        res.data.visibility ??
          (res.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      );
      setReleaseDate(res.data.releaseDate ?? '');
      setDownloadsEnabled(res.data.downloadsEnabled ?? false);
      setCommentsEnabled(res.data.commentsEnabled ?? true);
    });
    void fetchStudioArchive().then((res) => {
      setPinnedCount(countPinnedTracks(res.data));
    });
    void fetchEditorDraft(id).then((res) => {
      setEditList(res.data.editList);
      const level = res.data.editorPeaks?.levels?.[0];
      setPeaks(level && level.length > 0 ? level : []);
    });
    reloadVersions();
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = await patchStudioArchiveItem(id, {
      title,
      description,
      genre: genre || null,
      isPublic: visibility === 'PUBLIC',
      visibility,
      releaseDate: releaseDate || null,
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
    if (next) {
      const blocked = pinBlockedMessage(pinnedCount);
      if (blocked) {
        setMessage(blocked);
        return;
      }
    }
    setPinBusy(true);
    const result = await patchStudioArchiveItem(id, { pinned: next });
    setPinBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setItem(result.data);
    setPinnedCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    setMessage(next ? 'Pinned to your public page.' : 'Unpinned.');
  };

  const toggleRotation = async () => {
    if (!item) {
      return;
    }
    const next = !item.isFallback;
    setRotationBusy(true);
    setMessage(null);
    const result = await patchStudioArchiveItem(id, { isFallback: next });
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

  const startPlayback = async (startAt?: number) => {
    if (!item) {
      return;
    }
    const playableId = `archive:${id}`;
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
    reloadVersions();
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

  const onActivateVersion = (versionId: string) => {
    setVersionBusy(versionId);
    void activateArchiveVersion(id, versionId).then((r) => {
      setVersionBusy(null);
      if (!r.ok) {
        setQuickMsg(r.error);
        return;
      }
      setVersions(r.data);
    });
  };

  const onDownloadVersion = (versionId: string) => {
    void fetchVersionDownloadUrl(id, versionId).then((r) => {
      if (!r.ok) {
        setQuickMsg(r.error);
        return;
      }
      window.open(r.url, '_blank', 'noopener,noreferrer');
    });
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
  const pinned = item ? isPinned(item) : false;
  const pinBlocked = !pinned && pinnedCount >= MAX_PINNED_TRACKS;
  const isCurrent = currentId === `archive:${id}`;
  const isPlaying =
    isCurrent && (playerStatus === 'playing' || playerStatus === 'loading');

  return (
    <StudioGate>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <StudioNav current="/studio/archive" />
        <Link
          to="/studio/archive"
          className="text-foreground-secondary text-xs hover:underline"
        >
          ← Music
        </Link>
        {!item ? (
          <p className="text-foreground-secondary text-sm">Loading…</p>
        ) : (
          <>
            <header className="border-border bg-background-secondary/30 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
              <div className="border-border bg-background flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
                {item.bannerUrl ? (
                  <img
                    src={item.bannerUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <AudioLinesIcon
                    size={32}
                    aria-hidden
                    className="text-foreground-secondary"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                  {item.title}
                </h1>
                <p className="text-foreground-secondary mt-1 text-sm">
                  Edit title, description, and visibility.
                  <span className="ml-2 text-xs tracking-wide uppercase opacity-70">
                    {item.status}, {visibilityLabel}
                    {pinned ? ', Pinned' : ''}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-56 sm:justify-end">
                <Button
                  size="sm"
                  disabled={playBusy}
                  aria-label="Play track"
                  onClick={() => {
                    if (isPlaying) {
                      setPlayerStatus('paused');
                    } else {
                      void startPlayback();
                    }
                  }}
                >
                  {isPlaying ? (
                    <PauseIcon size={16} aria-hidden className="mr-1.5" />
                  ) : (
                    <PlayIcon size={16} aria-hidden className="mr-1.5" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  size="sm"
                  variant={item.isFallback ? 'secondary' : 'default'}
                  disabled={rotationBusy}
                  aria-label={
                    item.isFallback ? 'Remove from rotation' : 'Add to rotation'
                  }
                  onClick={() => void toggleRotation()}
                >
                  <RadioTowerIcon size={16} aria-hidden className="mr-1.5" />
                  {rotationBusy
                    ? 'Updating…'
                    : item.isFallback
                      ? 'In rotation'
                      : 'Add to rotation'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pinBusy || pinBlocked}
                  title={
                    pinBlocked
                      ? (pinBlockedMessage(pinnedCount) ?? undefined)
                      : undefined
                  }
                  onClick={() => void togglePin()}
                >
                  {pinned ? (
                    <PinOffIcon size={16} aria-hidden className="mr-1.5" />
                  ) : (
                    <PinIcon size={16} aria-hidden className="mr-1.5" />
                  )}
                  {pinBusy
                    ? '…'
                    : pinned
                      ? 'Unpin from page'
                      : `Pin to page (${pinnedCount}/${MAX_PINNED_TRACKS})`}
                </Button>
                <Link
                  to="/studio/insights/$kind/$id"
                  params={{ kind: 'archive', id }}
                  aria-label="Open track insights"
                >
                  <Button size="sm" variant="secondary">
                    <BarChart3Icon size={16} aria-hidden className="mr-1.5" />
                    Insights
                  </Button>
                </Link>
                {tab === 'details' ? (
                  <Button
                    disabled={saving || !title.trim()}
                    onClick={() => void save()}
                  >
                    <SaveIcon size={16} aria-hidden className="mr-1.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                ) : null}
              </div>
            </header>

            {pinBlocked && (
              <p className="text-foreground-secondary text-sm" role="status">
                {pinBlockedMessage(pinnedCount)}
              </p>
            )}

            <div
              className="border-border flex gap-1 overflow-x-auto border-b"
              role="tablist"
              aria-label="Track detail sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'details'}
                onClick={() => setTab('details')}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === 'details'
                    ? 'border-primary text-foreground'
                    : 'text-foreground-secondary hover:text-foreground border-transparent'
                }`}
              >
                <TagsIcon size={15} aria-hidden />
                Details
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'playlists'}
                onClick={() => setTab('playlists')}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === 'playlists'
                    ? 'border-primary text-foreground'
                    : 'text-foreground-secondary hover:text-foreground border-transparent'
                }`}
              >
                <ListMusicIcon size={15} aria-hidden />
                Playlists
              </button>
            </div>

            {message && (
              <p className="text-foreground-secondary text-sm">{message}</p>
            )}

            {tab === 'details' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    Release date
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(event) => setReleaseDate(event.target.value)}
                      className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-foreground-secondary text-xs uppercase">
                        Description
                      </span>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={4}
                        className="border-border bg-background focus:border-primary rounded-md border px-3 py-2 outline-none"
                      />
                    </label>
                  </div>
                  <CreatableCombobox
                    label="Genre"
                    options={[...PRESET_GENRES]}
                    value={genre}
                    onValueChange={setGenre}
                    normalize={capitalizeGenre}
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    Visibility
                    <select
                      aria-label="Visibility"
                      value={visibility}
                      onChange={(event) =>
                        setVisibility(
                          event.target.value as
                            | 'PUBLIC'
                            | 'UNLISTED'
                            | 'PRIVATE',
                        )
                      }
                      className="border-border bg-background h-10 rounded-md border px-3 text-sm"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="UNLISTED">
                        Unlisted — direct link only
                      </option>
                      <option value="PRIVATE">Private — only you</option>
                    </select>
                  </label>
                  <label className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={downloadsEnabled}
                      onChange={(event) =>
                        setDownloadsEnabled(event.target.checked)
                      }
                      aria-label="Allow downloads"
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium">Allow downloads</span>
                      <span className="text-foreground-secondary block text-xs">
                        Listeners can download the released audio file.
                      </span>
                    </span>
                  </label>
                  <label className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={commentsEnabled}
                      onChange={(event) =>
                        setCommentsEnabled(event.target.checked)
                      }
                      aria-label="Allow comments"
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium">Allow comments</span>
                      <span className="text-foreground-secondary block text-xs">
                        Listeners can discuss this track on its public page.
                      </span>
                    </span>
                  </label>
                </div>

                <section
                  className="flex flex-col gap-3"
                  aria-label="Waveform preview"
                >
                  <h2>
                    <Eyebrow>Waveform preview</Eyebrow>
                  </h2>
                  <WaveformCanvas
                    peaks={peaks}
                    durationSec={
                      editList?.sourceDuration ?? item.durationSec ?? 0
                    }
                    currentTime={isCurrent ? currentTime : 0}
                    cuts={editList?.cuts ?? []}
                    selection={null}
                    onSeek={(seconds) => void startPlayback(seconds)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={quickBusy !== null}
                      onClick={onNormalize}
                    >
                      {quickBusy === 'normalize' ? 'Normalizing…' : 'Normalize'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={quickBusy !== null}
                      onClick={onAutoTrim}
                    >
                      {quickBusy === 'trim' ? 'Trimming…' : 'Auto-trim silence'}
                    </Button>
                    <Link
                      to="/studio/archive/$id/editor"
                      params={{ id }}
                      aria-label="Open audio editor"
                    >
                      <Button size="sm" variant="text">
                        <AudioLinesIcon
                          size={16}
                          aria-hidden
                          className="mr-1.5"
                        />
                        Open audio editor
                      </Button>
                    </Link>
                    {isCurrent && playerDuration > 0 ? (
                      <span className="text-foreground-secondary ml-auto text-xs tabular-nums">
                        {Math.floor(currentTime / 60)}:
                        {String(Math.floor(currentTime % 60)).padStart(2, '0')}{' '}
                        / {Math.floor(playerDuration / 60)}:
                        {String(Math.floor(playerDuration % 60)).padStart(
                          2,
                          '0',
                        )}
                      </span>
                    ) : null}
                  </div>
                  {quickMsg && (
                    <p className="text-foreground-secondary text-xs">
                      {quickMsg}
                    </p>
                  )}
                </section>

                {versions.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <h2>
                      <Eyebrow>Revision history</Eyebrow>
                    </h2>
                    <p className="text-foreground-secondary text-xs">
                      Every save or quick fix creates a new version — older ones
                      stay here until they're cleaned up server-side.
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {versions
                        .slice()
                        .reverse()
                        .map((v) => (
                          <li
                            key={v.id}
                            className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                v{v.versionNumber} — {v.versionLabel}
                                {v.isActive && (
                                  <span className="text-primary ml-2 text-xs uppercase">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-foreground-secondary text-xs">
                                {v.status}
                                {v.durationSec
                                  ? ` · ${Math.round(v.durationSec)}s`
                                  : ''}
                                {v.sourceBitrateKbps
                                  ? ` · ${v.sourceBitrateKbps}kbps`
                                  : ''}
                                {' · '}
                                {new Date(v.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {v.status === 'READY' && (
                                <Button
                                  size="sm"
                                  variant="text"
                                  onClick={() => onDownloadVersion(v.id)}
                                >
                                  Download
                                </Button>
                              )}
                              {!v.isActive && v.status === 'READY' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={versionBusy === v.id}
                                  onClick={() => onActivateVersion(v.id)}
                                >
                                  {versionBusy === v.id
                                    ? 'Switching…'
                                    : 'Use this version'}
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              <section className="border-border bg-background-secondary/30 flex flex-col gap-4 rounded-xl border p-5">
                <div className="flex items-start gap-3">
                  <ListMusicIcon
                    size={28}
                    className="text-primary shrink-0"
                    aria-hidden
                  />
                  <div>
                    <h2 className="font-semibold">Add to playlists</h2>
                    <p className="text-foreground-secondary text-sm">
                      Add this track to one or more playlists, or create a new
                      playlist without leaving the track page.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="self-start"
                  onClick={() => setPlaylistOpen(true)}
                >
                  <ListMusicIcon size={15} aria-hidden className="mr-1.5" />
                  Choose playlists
                </Button>
              </section>
            )}
          </>
        )}
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          archiveItemId={id}
          trackTitle={item?.title ?? title}
          onClose={() => setPlaylistOpen(false)}
        />
      </div>
    </StudioGate>
  );
}
