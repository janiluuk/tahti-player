import { Link } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CropIcon,
  GripVerticalIcon,
  MapPinIcon,
  Maximize2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ScissorsIcon,
  SplitIcon,
  Trash2Icon,
  UploadIcon,
  Volume2Icon,
  VolumeXIcon,
  Wand2Icon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardGrid,
  Dialog,
  FilterChips,
  Input,
  SaveButton,
  Slider,
  TabLabel,
  Tabs,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchArchiveVersions } from '../../api/archive-versions';
import {
  fetchEditorDraft,
  fetchEditorSource,
  fetchSoundStems,
  renderEditorDraft,
  requestSoundStems,
  saveEditorDraft,
  STEM_SET_LABELS,
  type StemJob,
  type StemSet,
} from '../../api/studio';
import type { EditList, ProEditorPluginId } from '../../api/studio-types';
import { createDefaultEditList } from '../../api/studio-types';
import { ClientCapabilityNotice } from '../../components/ClientCapabilityNotice';
import { PageLoading } from '../../components/PageStates';
import { StemPlayer } from '../../components/StemPlayer';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { WaveformCanvas } from '../../components/WaveformCanvas';
import { WaveformMinimap } from '../../components/WaveformMinimap';
import { useAudioPreviewGraph } from '../../lib/audioPreviewGraph';
import { AUDIO_FX_PLUGINS, useAudioFxStore } from '../../plugins/audio-fx';
import {
  addPluginToChain,
  removePluginFromChain,
  reorderPluginChain,
} from '../../plugins/audio-fx/chain';
import { useMasteringFeatureStore } from '../../plugins/mastering/store';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) {
    return '0:00';
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Big brand-tile icon for a plugin — same idiom as SourceServiceIcon,
 * used both in the "add plugin" picker and each active panel's badge. */
function PluginIcon({
  id,
  size = 56,
}: {
  id: ProEditorPluginId;
  size?: number;
}) {
  const meta = AUDIO_FX_PLUGINS[id];
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: meta.bg }}
      aria-hidden
    >
      <meta.icon
        size={size}
        absoluteStrokeWidth
        strokeWidth={1.5}
        className="text-white opacity-95"
      />
    </div>
  );
}

const FILTER_MODES = [
  { id: 'lowpass', label: 'Low-pass', path: 'M2 4 C8 4 10 20 22 20 H30' },
  { id: 'highpass', label: 'High-pass', path: 'M2 20 H12 C20 20 22 4 30 4' },
  {
    id: 'lowshelf',
    label: 'Low shelf',
    path: 'M2 18 C10 18 14 17 20 10 S26 6 30 6',
  },
  {
    id: 'highshelf',
    label: 'High shelf',
    path: 'M2 6 C10 6 14 7 20 14 S26 18 30 18',
  },
] as const;

const FILTER_SLOPES = [
  {
    id: '12db',
    label: '12 dB/oct',
    path: 'M2 5 C12 5 17 8 22 13 S27 19 30 20',
  },
  {
    id: '24db',
    label: '24 dB/oct',
    path: 'M2 5 C14 5 19 8 24 17 S28 20 30 20',
  },
  { id: 'brickwall', label: 'Brickwall', path: 'M2 5 H22 V20 H30' },
] as const;

function FilterCurve({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 32 24" className="h-7 w-10" aria-hidden>
      <path d="M1 20 H31" stroke="currentColor" strokeOpacity=".2" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function StudioProEditorView({ soundId }: { soundId: string }) {
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [editList, setEditList] = useState<EditList | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [versionLabel, setVersionLabel] = useState('Edited mix');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Tracks a render's versionId while it's PENDING/PROCESSING so we can
  // poll for completion — the old Next app streamed live SSE progress via
  // a route handler (apps/web/.../editor/progress/[versionId]); the SPA
  // has no equivalent, so without this the render fires-and-forgets with
  // a one-time toast and no feedback loop until the user manually checks
  // Revision history.
  const [renderPendingVersionId, setRenderPendingVersionId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [stems, setStems] = useState<StemJob[]>([]);
  const [activeStemSet, setActiveStemSet] = useState<StemSet>('TWO_STEM');
  const [markers, setMarkers] = useState<number[]>([]);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(1);
  const [previewingSelection, setPreviewingSelection] = useState(false);
  const [masteringCollapsed, setMasteringCollapsed] = useState(true);
  const [pluginPickerOpen, setPluginPickerOpen] = useState(false);
  const [renderPromptOpen, setRenderPromptOpen] = useState(false);
  const selectionRef = useRef(selection);
  const previewingSelectionRef = useRef(previewingSelection);
  const dragPluginRef = useRef<ProEditorPluginId | null>(null);

  useAudioPreviewGraph(audioRef, editList);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    previewingSelectionRef.current = previewingSelection;
  }, [previewingSelection]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchEditorSource(soundId),
      fetchEditorDraft(soundId),
    ]).then(([src, draft]) => {
      if (cancelled) {
        return;
      }
      setSourceUrl(src.data.url);
      setTitle(src.data.title);
      const fromDraft = draft.data.editList;
      const durationHint =
        src.data.durationSec ?? fromDraft?.sourceDuration ?? 180;
      const list = fromDraft ?? createDefaultEditList(durationHint);
      if (src.data.durationSec && list.sourceDuration < 1) {
        list.sourceDuration = src.data.durationSec;
      }
      setEditList(list);
      setUpdatedAt(draft.data.updatedAt);
      const level = draft.data.editorPeaks?.levels?.[0];
      setPeaks(level && level.length > 0 ? level : []);
      setLoading(false);
    });
    void fetchSoundStems(soundId).then((r) => {
      if (!cancelled) {
        setStems(r.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  // Stem separation runs on a GPU worker and can take a while — poll until
  // every requested job has left PENDING/PROCESSING rather than making the
  // user manually refresh to see when a split is ready.
  useEffect(() => {
    if (
      !stems.some((s) => s.status === 'PENDING' || s.status === 'PROCESSING')
    ) {
      return;
    }
    const timer = setInterval(() => {
      void fetchSoundStems(soundId).then((r) => {
        for (const next of r.data) {
          const prev = stems.find((s) => s.stemSet === next.stemSet);
          const wasProcessing =
            prev?.status === 'PENDING' || prev?.status === 'PROCESSING';
          const label =
            STEM_SET_LABELS[next.stemSet as StemSet] ?? next.stemSet;
          if (wasProcessing && next.status === 'READY') {
            toast.success(`${label} split ready.`);
          } else if (wasProcessing && next.status === 'ERROR') {
            toast.error(next.errorMessage || `${label} split failed.`);
          }
        }
        setStems(r.data);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [soundId, stems]);

  useEffect(() => {
    if (!renderPendingVersionId) {
      return;
    }
    const timer = setInterval(() => {
      void fetchArchiveVersions(soundId).then((r) => {
        const version = r.data.find((v) => v.id === renderPendingVersionId);
        if (
          !version ||
          version.status === 'PENDING' ||
          version.status === 'PROCESSING'
        ) {
          return;
        }
        setRenderPendingVersionId(null);
        setMessage(
          version.status === 'READY'
            ? `Version ${version.versionNumber} is ready${version.isActive ? ' and live' : " — activate it from Revision history when you're ready"}.`
            : `Version ${version.versionNumber} failed to render.`,
        );
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [soundId, renderPendingVersionId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !sourceUrl) {
      return;
    }
    // crossOrigin is required for the live plugin-preview graph (see
    // useAudioPreviewGraph) -- without it, connecting a
    // MediaElementAudioSourceNode to a cross-origin source silently
    // zeroes all audio output, playback included, once anything touches
    // the Web Audio graph. If the source doesn't actually serve CORS
    // headers, setting crossOrigin instead makes the browser refuse to
    // load it at all -- fall back to a plain, non-CORS load so playback
    // at least still works (live preview just won't be audible for that
    // source), same "attempt then degrade" discipline as the peaks
    // fallback below.
    audio.crossOrigin = 'anonymous';
    audio.src = sourceUrl;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (
        previewingSelectionRef.current &&
        selectionRef.current &&
        audio.currentTime >= selectionRef.current.end
      ) {
        audio.pause();
        setPreviewingSelection(false);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      if (audio.crossOrigin) {
        audio.crossOrigin = null;
        audio.src = sourceUrl;
        audio.load();
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [sourceUrl]);

  // When server peaks are missing, decode audio in-browser for a usable waveform.
  useEffect(() => {
    if (!sourceUrl || peaks.length > 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          return;
        }
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf.slice(0));
        await ctx.close();
        if (cancelled) {
          return;
        }
        const channel = decoded.getChannelData(0);
        const buckets = 256;
        const block = Math.floor(channel.length / buckets) || 1;
        const next: number[] = [];
        for (let i = 0; i < buckets; i++) {
          let peak = 0;
          const start = i * block;
          for (let j = 0; j < block && start + j < channel.length; j++) {
            peak = Math.max(peak, Math.abs(channel[start + j]!));
          }
          next.push(peak);
        }
        const max = Math.max(...next, 0.001);
        setPeaks(next.map((v) => v / max));
        setEditList((prev) => {
          if (!prev) {
            return prev;
          }
          if (prev.sourceDuration >= 1) {
            return prev;
          }
          return { ...prev, sourceDuration: decoded.duration };
        });
      } catch {
        // Keep synthetic waveform fallback in WaveformCanvas.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, peaks.length]);

  const duration = editList?.sourceDuration ?? 0;

  const keptDuration = useMemo(() => {
    if (!editList) {
      return 0;
    }
    let removed = 0;
    for (const c of editList.cuts) {
      removed += Math.max(0, c.end - c.start);
    }
    return Math.max(0, editList.sourceDuration - removed);
  }, [editList]);

  const seek = (sec: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = sec;
    setCurrentTime(sec);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setPreviewingSelection(false);
    if (audio.paused) {
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  };

  const previewSelection = () => {
    const audio = audioRef.current;
    if (!audio || !selection) {
      return;
    }
    setPreviewingSelection(true);
    audio.currentTime = selection.start;
    setCurrentTime(selection.start);
    void audio.play().catch(() => undefined);
  };

  const addCutFromSelection = () => {
    if (!editList || !selection) {
      return;
    }
    if (selection.end - selection.start < 0.05) {
      return;
    }
    setEditList({
      ...editList,
      cuts: [
        ...editList.cuts,
        { start: selection.start, end: selection.end },
      ].sort((a, b) => a.start - b.start),
    });
    setSelection(null);
    setMessage('Cut region marked (removed on render).');
  };

  const trimToSelection = () => {
    if (!editList || !selection) {
      return;
    }
    const cuts = [
      ...(selection.start > 0.05 ? [{ start: 0, end: selection.start }] : []),
      ...(selection.end < editList.sourceDuration - 0.05
        ? [{ start: selection.end, end: editList.sourceDuration }]
        : []),
    ];
    setEditList({ ...editList, cuts });
    setMessage('Trimmed to selection (head/tail marked as cuts).');
  };

  const clearCuts = () => {
    if (!editList) {
      return;
    }
    setEditList({ ...editList, cuts: [] });
    setMessage('Cuts cleared.');
  };

  const pluginChain = editList?.pluginChain ?? [];
  const enabledPluginIds = useAudioFxStore((state) => state.enabledPluginIds);
  const visiblePluginChain = pluginChain.filter((id) =>
    enabledPluginIds.includes(id),
  );

  const addPlugin = (id: ProEditorPluginId) => {
    if (
      !editList ||
      pluginChain.includes(id) ||
      !enabledPluginIds.includes(id)
    ) {
      return;
    }
    setEditList(addPluginToChain(editList, id));
    setPluginPickerOpen(false);
  };

  const togglePluginEnabled = (id: ProEditorPluginId) => {
    if (!editList) {
      return;
    }
    const enabled = !AUDIO_FX_PLUGINS[id].isEnabled(editList);
    const next = { ...editList };
    if (id === 'eq') {
      next.eq = { ...next.eq, enabled };
    }
    if (id === 'comp') {
      next.comp = { ...next.comp, enabled };
    }
    if (id === 'limiter') {
      next.limiter = { ...next.limiter, enabled };
    }
    if (id === 'filter') {
      next.filter = { ...next.filter, enabled };
    }
    setEditList(next);
  };

  const removePlugin = (id: ProEditorPluginId) => {
    if (!editList) {
      return;
    }
    setEditList(removePluginFromChain(editList, id));
  };

  const reorderPlugin = (
    dragId: ProEditorPluginId,
    dropId: ProEditorPluginId,
  ) => {
    if (!editList || dragId === dropId) {
      return;
    }
    setEditList(reorderPluginChain(editList, dragId, dropId));
  };

  const normalize = () => {
    if (!editList) {
      return;
    }
    setEditList({
      ...editList,
      loudnorm: { ...editList.loudnorm, enabled: !editList.loudnorm.enabled },
    });
    setMessage(
      editList.loudnorm.enabled
        ? 'Normalization turned off.'
        : `Normalizing to ${editList.loudnorm.targetLufs} LUFS on render.`,
    );
  };

  /** Cuts leading/trailing near-silence off the current peaks -- a quick
   * approximation (peaks are already-bucketed amplitude, not raw PCM, so
   * this can't be as precise as a real silence-region detector) rather
   * than requiring the user to find and select the edges by hand. */
  const trimSilence = () => {
    if (!editList || peaks.length === 0 || editList.sourceDuration <= 0) {
      setMessage('No waveform loaded yet to trim.');
      return;
    }
    const threshold = 0.06;
    let start = 0;
    while (start < peaks.length && peaks[start]! < threshold) {
      start++;
    }
    let end = peaks.length - 1;
    while (end > start && peaks[end]! < threshold) {
      end--;
    }
    const secPerBucket = editList.sourceDuration / peaks.length;
    const startSec = start * secPerBucket;
    const endSec = (end + 1) * secPerBucket;
    const newCuts = [...editList.cuts];
    let trimmed = false;
    if (startSec > 0.3) {
      newCuts.push({ start: 0, end: startSec });
      trimmed = true;
    }
    if (editList.sourceDuration - endSec > 0.3) {
      newCuts.push({ start: endSec, end: editList.sourceDuration });
      trimmed = true;
    }
    if (!trimmed) {
      setMessage('No leading/trailing silence found.');
      return;
    }
    setEditList({
      ...editList,
      cuts: newCuts.sort((a, b) => a.start - b.start),
    });
    setMessage('Trimmed leading/trailing silence.');
  };

  const MIN_ZOOM_SPAN = 0.005;

  /** Zooms the waveform view around its current center — the toolbar
   * button equivalent of WaveformCanvas's wheel-zoom-to-cursor, which
   * has no cursor position to anchor to. `factor` > 1 zooms out (wider
   * span), < 1 zooms in. */
  const zoomBy = (factor: number) => {
    const span = Math.max(MIN_ZOOM_SPAN, viewEnd - viewStart);
    const center = viewStart + span / 2;
    const nextSpan = Math.min(1, Math.max(MIN_ZOOM_SPAN, span * factor));
    let start = center - nextSpan / 2;
    let end = start + nextSpan;
    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > 1) {
      start -= end - 1;
      end = 1;
    }
    setViewStart(Math.max(0, start));
    setViewEnd(Math.min(1, end));
  };

  const save = async () => {
    if (!editList) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await saveEditorDraft(soundId, editList, updatedAt);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setUpdatedAt(result.updatedAt);
    setMessage('Draft saved.');
  };

  const render = async (activate: boolean) => {
    if (!editList) {
      return;
    }
    setRenderPromptOpen(false);
    setBusy(true);
    setMessage(null);
    const saveFirst = await saveEditorDraft(soundId, editList, updatedAt);
    if (saveFirst.ok) {
      setUpdatedAt(saveFirst.updatedAt);
    }
    const result = await renderEditorDraft(
      soundId,
      editList,
      versionLabel.trim() || 'Edited mix',
      activate,
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    if (result.status === 'PENDING' || result.status === 'PROCESSING') {
      setRenderPendingVersionId(result.versionId);
      setMessage(
        activate
          ? `Rendering — this version will go live once it's ready…`
          : `Rendering as a new revision — the current live version is untouched…`,
      );
    } else {
      setMessage(
        activate
          ? `Render started — version ${result.versionId} will go live, ${result.status.toLowerCase()}.`
          : `Saved as a new revision — version ${result.versionId}, ${result.status.toLowerCase()}. The current live version is untouched; activate it from Revision history when you're ready.`,
      );
    }
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/editor" />
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/studio/sounds"
            className="text-foreground-secondary hover:underline"
          >
            ← Music
          </Link>
          <Link
            to="/studio/sounds/$id"
            params={{ id: soundId }}
            className="text-foreground-secondary hover:underline"
          >
            Metadata
          </Link>
          <Link
            to="/studio/editor"
            className="text-foreground-secondary hover:underline"
          >
            Projects
          </Link>
          {masteringEnabled && (
            <Link
              to="/studio/mastering/$id"
              params={{ id: soundId }}
              className="text-foreground-secondary hover:underline"
            >
              Mastering
            </Link>
          )}
        </div>

        <ViewShell
          title={title || 'Pro editor'}
          classes={{ root: 'px-0 pt-0' }}
        >
          <ClientCapabilityNotice kind="partial" title="Single-track editor">
            Cut, trim, adjust effects, or request stems here. Use a multitrack
            session when you need to arrange several tracks together.
          </ClientCapabilityNotice>

          {loading || !editList ? (
            <StudioPanel>
              <PageLoading label="Loading editor…" />
            </StudioPanel>
          ) : (
            <>
              <StudioPanel className="!p-0">
                <div
                  role="toolbar"
                  aria-label="Editor tools"
                  className="border-border bg-background-secondary flex flex-wrap items-center gap-1 rounded-t-xl border-b px-3 py-2"
                >
                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label="Transport"
                  >
                    <Button size="sm" onClick={togglePlay}>
                      {playing ? (
                        <PauseIcon size={16} aria-hidden className="mr-1.5" />
                      ) : (
                        <PlayIcon size={16} aria-hidden className="mr-1.5" />
                      )}
                      {playing ? 'Pause' : 'Play'}
                    </Button>
                    <Tooltip content="Preview selection" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={!selection}
                        onClick={previewSelection}
                        aria-label="Preview selection"
                      >
                        <Volume2Icon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>

                  <div className="bg-border mx-1 h-6 w-px" aria-hidden />

                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label="Cut and trim"
                  >
                    <Tooltip content="Cut selection" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={!selection}
                        onClick={addCutFromSelection}
                        aria-label="Cut selection"
                      >
                        <ScissorsIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Trim to selection" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={!selection}
                        onClick={trimToSelection}
                        aria-label="Trim to selection"
                      >
                        <CropIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Trim leading/trailing silence" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        onClick={trimSilence}
                        aria-label="Trim leading/trailing silence"
                      >
                        <VolumeXIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Clear cuts" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={editList.cuts.length === 0}
                        onClick={clearCuts}
                        aria-label="Clear cuts"
                      >
                        <Trash2Icon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Clear selection" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={!selection}
                        onClick={() => setSelection(null)}
                        aria-label="Clear selection"
                      >
                        <XIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>

                  <div className="bg-border mx-1 h-6 w-px" aria-hidden />

                  <Tooltip content="Add marker at playhead" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      onClick={() =>
                        setMarkers((m) =>
                          [...m, currentTime].sort((a, b) => a - b),
                        )
                      }
                      aria-label="Add marker at playhead"
                    >
                      <MapPinIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>

                  <div className="bg-border mx-1 h-6 w-px" aria-hidden />

                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label="Zoom"
                  >
                    <Tooltip content="Zoom out" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        onClick={() => zoomBy(1.25)}
                        aria-label="Zoom out"
                      >
                        <ZoomOutIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Zoom in" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        onClick={() => zoomBy(0.8)}
                        aria-label="Zoom in"
                      >
                        <ZoomInIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Reset zoom" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        disabled={viewStart === 0 && viewEnd === 1}
                        onClick={() => {
                          setViewStart(0);
                          setViewEnd(1);
                        }}
                        aria-label="Reset zoom"
                      >
                        <Maximize2Icon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>

                  <div className="flex-1" />

                  <div className="text-foreground-secondary hidden items-center gap-3 text-xs sm:flex">
                    <span>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <span>Kept: {formatTime(keptDuration)}</span>
                    <span>{editList.cuts.length} cut(s)</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <WaveformCanvas
                    peaks={peaks}
                    durationSec={duration}
                    currentTime={currentTime}
                    cuts={editList.cuts}
                    selection={selection}
                    viewStart={viewStart}
                    viewEnd={viewEnd}
                    onViewChange={(start, end) => {
                      setViewStart(start);
                      setViewEnd(end);
                    }}
                    onSeek={seek}
                    onSelectRange={(start, end) => setSelection({ start, end })}
                  />

                  <div className="mt-2">
                    <WaveformMinimap
                      peaks={peaks}
                      viewStart={viewStart}
                      viewEnd={viewEnd}
                      onSeek={(frac) => seek(frac * duration)}
                    />
                  </div>

                  <div className="text-foreground-secondary mt-3 flex flex-wrap items-center gap-3 text-xs sm:hidden">
                    <span>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <span>Kept after cuts: {formatTime(keptDuration)}</span>
                    <span>{editList.cuts.length} cut(s)</span>
                  </div>
                  {selection && (
                    <div className="text-foreground-secondary mt-1 text-xs">
                      Selection {formatTime(selection.start)}–
                      {formatTime(selection.end)}
                    </div>
                  )}

                  {markers.length > 0 && (
                    <div className="text-foreground-secondary mt-3 flex flex-wrap items-center gap-2 text-xs">
                      Markers:{' '}
                      {markers.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="border-border rounded border px-1.5 py-0.5 hover:underline"
                          onClick={() => seek(m)}
                        >
                          {formatTime(m)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setMarkers([])}
                      >
                        clear
                      </button>
                    </div>
                  )}
                </div>
              </StudioPanel>

              <div className="grid gap-4 md:grid-cols-2">
                <StudioPanel title="Stems">
                  <div className="mb-4 flex flex-col gap-2">
                    <Tabs.Root
                      selectedIndex={activeStemSet === 'FOUR_STEM' ? 1 : 0}
                      onChange={(index) =>
                        setActiveStemSet(index === 1 ? 'FOUR_STEM' : 'TWO_STEM')
                      }
                    >
                      <Tabs.List className="w-fit">
                        {(['TWO_STEM', 'FOUR_STEM'] as const).map((stemSet) => (
                          <Tabs.Tab key={stemSet}>
                            <TabLabel
                              icon={<SplitIcon size={14} />}
                              count={stemSet === 'TWO_STEM' ? 2 : 4}
                            >
                              {STEM_SET_LABELS[stemSet]}
                            </TabLabel>
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs.Root>

                    {(() => {
                      const existing = stems.find(
                        (s) => s.stemSet === activeStemSet,
                      );
                      const busyStem =
                        existing?.status === 'PENDING' ||
                        existing?.status === 'PROCESSING';
                      return (
                        <div className="flex flex-col gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyStem}
                            className="self-start"
                            onClick={() => {
                              toast.info(
                                `Splitting into ${STEM_SET_LABELS[activeStemSet].toLowerCase()}…`,
                              );
                              void requestSoundStems(
                                soundId,
                                activeStemSet,
                              ).then((r) => {
                                if (!r.ok) {
                                  toast.error(r.error);
                                } else {
                                  void fetchSoundStems(soundId).then((s) =>
                                    setStems(s.data),
                                  );
                                }
                              });
                            }}
                          >
                            {busyStem
                              ? 'Splitting…'
                              : `Split ${STEM_SET_LABELS[activeStemSet].toLowerCase()}`}
                          </Button>
                          {busyStem && (
                            <div
                              className="bg-background-secondary relative h-1.5 w-48 overflow-hidden rounded-full"
                              role="progressbar"
                              aria-label={`Splitting into ${STEM_SET_LABELS[activeStemSet]}`}
                            >
                              <div className="bg-primary absolute inset-0 w-1/3 animate-pulse rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {stems.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No stem jobs yet — request a split above. Splits are
                      cached for 7 days, then cleared automatically.
                    </p>
                  ) : (
                    <ul className="divide-border divide-y">
                      {stems.map((job) => (
                        <li
                          key={job.stemSet}
                          className="py-2.5 text-sm first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {STEM_SET_LABELS[job.stemSet as StemSet] ??
                                job.stemSet}
                            </span>
                            <span className="text-foreground-secondary font-mono text-xs uppercase">
                              {job.status}
                            </span>
                          </div>
                          {job.status === 'ERROR' && job.errorMessage && (
                            <p className="text-accent-red mt-1 text-xs">
                              {job.errorMessage}
                            </p>
                          )}
                          {job.files && job.files.length > 0 && (
                            <div className="mt-2">
                              <StemPlayer files={job.files} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </StudioPanel>

                <StudioPanel title="Export">
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Version label"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setRenderPromptOpen(true)}
                      >
                        <UploadIcon size={16} aria-hidden className="mr-1.5" />
                        Render version
                      </Button>
                      <SaveButton
                        saving={busy}
                        label="Save draft"
                        onClick={() => void save()}
                      />
                    </div>
                    {message && (
                      <p
                        className="text-foreground-secondary text-sm"
                        role="status"
                      >
                        {message}
                      </p>
                    )}
                  </div>
                </StudioPanel>
              </div>

              <StudioPanel
                title="Mastering"
                description={
                  masteringCollapsed
                    ? undefined
                    : 'Enabled effects are audible live in Play and Preview selection — this is a real-time approximation for monitoring, not the final render.'
                }
                action={
                  <Tooltip
                    content={
                      masteringCollapsed
                        ? 'Expand mastering'
                        : 'Minimize mastering'
                    }
                    side="top"
                  >
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={
                        masteringCollapsed
                          ? 'Expand mastering'
                          : 'Minimize mastering'
                      }
                      onClick={() => setMasteringCollapsed((v) => !v)}
                    >
                      {masteringCollapsed ? (
                        <ChevronRightIcon size={16} aria-hidden />
                      ) : (
                        <ChevronDownIcon size={16} aria-hidden />
                      )}
                    </Button>
                  </Tooltip>
                }
              >
                {!masteringCollapsed && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={
                          editList.loudnorm.enabled ? 'default' : 'secondary'
                        }
                        onClick={normalize}
                      >
                        <Wand2Icon size={14} aria-hidden className="mr-1.5" />
                        {editList.loudnorm.enabled
                          ? `Normalizing (${editList.loudnorm.targetLufs} LUFS)`
                          : 'Normalize'}
                      </Button>
                    </div>

                    <Slider
                      label="Master gain"
                      value={editList.gainDb}
                      min={-24}
                      max={12}
                      step={0.5}
                      unit="dB"
                      showFooter={false}
                      className="max-w-xs"
                      onValueChange={(gainDb) =>
                        setEditList({
                          ...editList,
                          gainDb,
                        })
                      }
                    />

                    <div className="flex flex-row items-start gap-3 overflow-x-auto pb-2">
                      {visiblePluginChain.length === 0 ? (
                        <p className="text-foreground-secondary text-sm">
                          No plugins in the chain yet.
                        </p>
                      ) : (
                        visiblePluginChain.map((id) => {
                          const meta = AUDIO_FX_PLUGINS[id];
                          return (
                            <div
                              key={id}
                              draggable
                              onDragStart={() => {
                                dragPluginRef.current = id;
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (dragPluginRef.current) {
                                  reorderPlugin(dragPluginRef.current, id);
                                }
                                dragPluginRef.current = null;
                              }}
                              className="border-border bg-background-secondary/40 w-80 shrink-0 rounded-lg border p-3"
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <span
                                  className="cursor-grab touch-none"
                                  aria-hidden
                                >
                                  <GripVerticalIcon
                                    size={16}
                                    className="text-foreground-secondary"
                                  />
                                </span>
                                <div className="size-7 shrink-0 overflow-hidden rounded">
                                  <PluginIcon id={id} size={16} />
                                </div>
                                <span className="text-sm font-semibold">
                                  {meta.label}
                                </span>
                                <span className="text-foreground-secondary flex-1 truncate text-xs">
                                  {meta.description}
                                </span>
                                <Toggle
                                  checked={meta.isEnabled(editList)}
                                  onChange={() => togglePluginEnabled(id)}
                                  aria-label={`${meta.isEnabled(editList) ? 'Disable' : 'Enable'} ${meta.label}`}
                                />
                                <Tooltip
                                  content={`Remove ${meta.label}`}
                                  side="top"
                                >
                                  <Button
                                    size="icon-sm"
                                    variant="text"
                                    aria-label={`Remove ${meta.label}`}
                                    onClick={() => removePlugin(id)}
                                  >
                                    <XIcon size={14} aria-hidden />
                                  </Button>
                                </Tooltip>
                              </div>

                              {id === 'eq' && (
                                <div className="grid gap-2 sm:grid-cols-3">
                                  {editList.eq.bands.map((band, i) => (
                                    <Slider
                                      key={band.freq}
                                      label={`${band.freq} Hz gain`}
                                      value={band.gainDb}
                                      min={-12}
                                      max={12}
                                      step={0.5}
                                      unit="dB"
                                      showFooter={false}
                                      onValueChange={(gainDb) => {
                                        const bands = editList.eq.bands.map(
                                          (entry, idx) =>
                                            idx === i
                                              ? {
                                                  ...entry,
                                                  gainDb,
                                                }
                                              : entry,
                                        );
                                        setEditList({
                                          ...editList,
                                          eq: { ...editList.eq, bands },
                                        });
                                      }}
                                    />
                                  ))}
                                </div>
                              )}

                              {id === 'comp' && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <Slider
                                    label="Threshold"
                                    value={editList.comp.thresholdDb}
                                    min={-40}
                                    max={0}
                                    step={1}
                                    unit="dB"
                                    showFooter={false}
                                    onValueChange={(thresholdDb) =>
                                      setEditList({
                                        ...editList,
                                        comp: {
                                          ...editList.comp,
                                          thresholdDb,
                                        },
                                      })
                                    }
                                  />
                                  <Slider
                                    label="Ratio"
                                    value={editList.comp.ratio}
                                    min={1}
                                    max={20}
                                    step={0.5}
                                    unit=":1"
                                    showFooter={false}
                                    onValueChange={(ratio) =>
                                      setEditList({
                                        ...editList,
                                        comp: {
                                          ...editList.comp,
                                          ratio,
                                        },
                                      })
                                    }
                                  />
                                </div>
                              )}

                              {id === 'limiter' && (
                                <Slider
                                  label="Ceiling"
                                  value={editList.limiter.ceilingDb}
                                  min={-6}
                                  max={0}
                                  step={0.1}
                                  unit="dB"
                                  showFooter={false}
                                  className="max-w-xs"
                                  onValueChange={(ceilingDb) =>
                                    setEditList({
                                      ...editList,
                                      limiter: {
                                        ...editList.limiter,
                                        ceilingDb,
                                      },
                                    })
                                  }
                                />
                              )}

                              {id === 'filter' && (
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <p className="text-foreground-secondary mb-2 text-xs uppercase">
                                      Filter type
                                    </p>
                                    <FilterChips
                                      aria-label="Filter type"
                                      items={FILTER_MODES.map((option) => ({
                                        id: option.id,
                                        label: option.label,
                                      }))}
                                      selected={editList.filter.mode}
                                      onChange={(mode) => {
                                        const next = FILTER_MODES.find(
                                          (option) => option.id === mode,
                                        );
                                        if (!next) {
                                          return;
                                        }
                                        setEditList({
                                          ...editList,
                                          filter: {
                                            ...editList.filter,
                                            mode: next.id,
                                          },
                                        });
                                      }}
                                    />
                                    {(() => {
                                      const selectedMode = FILTER_MODES.find(
                                        (option) =>
                                          option.id === editList.filter.mode,
                                      );
                                      return selectedMode ? (
                                        <div className="border-border mt-2 flex justify-center rounded border p-2">
                                          <FilterCurve
                                            path={selectedMode.path}
                                          />
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                  <Slider
                                    label="Freq"
                                    value={editList.filter.freq}
                                    min={20}
                                    max={20000}
                                    step={10}
                                    unit="Hz"
                                    showFooter={false}
                                    onValueChange={(freq) =>
                                      setEditList({
                                        ...editList,
                                        filter: {
                                          ...editList.filter,
                                          freq,
                                        },
                                      })
                                    }
                                  />
                                  <div>
                                    <p className="text-foreground-secondary mb-2 text-xs uppercase">
                                      Slope
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {FILTER_SLOPES.map((option) => (
                                        <button
                                          key={option.id}
                                          type="button"
                                          aria-pressed={
                                            editList.filter.slope === option.id
                                          }
                                          onClick={() =>
                                            setEditList({
                                              ...editList,
                                              filter: {
                                                ...editList.filter,
                                                slope: option.id,
                                              },
                                            })
                                          }
                                          className={`border-border flex items-center gap-2 rounded border px-2 py-1 text-xs ${editList.filter.slope === option.id ? 'border-primary bg-primary/10 text-foreground' : 'text-foreground-secondary hover:text-foreground'}`}
                                        >
                                          <FilterCurve path={option.path} />
                                          {option.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}

                      {enabledPluginIds.some(
                        (id) => !pluginChain.includes(id),
                      ) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPluginPickerOpen(true)}
                          className="shrink-0 self-start"
                        >
                          <PlusIcon size={14} aria-hidden className="mr-1.5" />
                          Add plugin
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </StudioPanel>

              <Dialog.Root
                isOpen={pluginPickerOpen}
                onClose={() => setPluginPickerOpen(false)}
              >
                <Dialog.Title>Add a plugin</Dialog.Title>
                <CardGrid className="grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
                  {enabledPluginIds
                    .filter((id) => !pluginChain.includes(id))
                    .map((id) => (
                      <Card
                        key={id}
                        title={AUDIO_FX_PLUGINS[id].label}
                        subtitle={AUDIO_FX_PLUGINS[id].description}
                        image={<PluginIcon id={id} />}
                        onClick={() => addPlugin(id)}
                      />
                    ))}
                </CardGrid>
                <Dialog.Actions>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Actions>
              </Dialog.Root>
            </>
          )}
        </ViewShell>

        <Dialog.Root
          isOpen={renderPromptOpen}
          onClose={() => setRenderPromptOpen(false)}
        >
          <Dialog.Title>
            Render “{versionLabel.trim() || 'Edited mix'}”
          </Dialog.Title>
          <Dialog.Description>
            Overwrite replaces what&apos;s live right now. Save as a new
            revision renders and adds it to Revision history without touching
            the current live version — activate it there whenever you&apos;re
            ready.
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button variant="secondary" onClick={() => void render(false)}>
              Save as new revision
            </Button>
            <Button onClick={() => void render(true)}>
              Overwrite live version
            </Button>
          </Dialog.Actions>
        </Dialog.Root>

        <audio ref={audioRef} preload="metadata" className="hidden" />
      </div>
    </StudioGate>
  );
}
