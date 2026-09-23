import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { toast } from 'sonner';

import type { EditList } from '../../../api/studio-types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { StudioPanel } from '../../../components/StudioPanel';
import { useAudioPreviewGraph } from '../../../lib/audioPreviewGraph';
import { keptDuration, mergeCuts, trimToRange } from './editCuts';
import { RegionList } from './RegionList';
import { formatClock, type TimeView } from './waveform/draw';
import {
  audibleRange,
  nearestListedCrossing,
  nearestZeroCrossing,
} from './waveform/peaks';
import { ProMinimap, type ProMinimapHandle } from './waveform/ProMinimap';
import { ProWaveform, type ProWaveformHandle } from './waveform/ProWaveform';
import { useWaveformData, type EditorPeaks } from './waveform/useWaveformData';
import {
  clampView,
  followPlayhead,
  minSpanSec,
  viewForRange,
  zoomAt,
} from './waveform/viewMath';
import { WaveformToolbar } from './WaveformToolbar';

type Range = { start: number; end: number };

type Confirm = {
  title: string;
  description: string;
  confirmLabel: string;
  run: () => void;
};

type Props = {
  sourceUrl: string | null;
  serverPeaks: EditorPeaks | null;
  editList: EditList;
  /** `coalesceKey` merges rapid edits of one kind into one undo step. */
  onChange: (next: EditList, coalesceKey?: string) => void;
  /** Reports a duration learned from decoding, for drafts without one. */
  onDuration: (seconds: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

const MS = 0.001;
const FALLBACK_RATE = 48000;

/** Shortest selection that counts as a cut or fade (about one sample). */
const MIN_REGION_SEC = 0.0001;

const STATUS_NOTE: Partial<Record<string, string>> = {
  decoding: 'Loading the sample-accurate waveform…',
  fine: 'Long file: showing 10 ms peaks from the server (zoom stops at that resolution).',
  'overview-only':
    'Showing overview peaks only: the file is too long (or could not be decoded) for a sample-level view.',
  failed: 'Could not decode the audio for a detailed waveform.',
};

/** The waveform, its toolbar, the overview strip and the audio element.
 * Playback moves the playhead through refs every animation frame, so it
 * never re-renders React (or the mastering/stems/export panels). */
export function WaveformEditor({
  sourceUrl,
  serverPeaks,
  editList,
  onChange,
  onDuration,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<ProWaveformHandle>(null);
  const minimapRef = useRef<ProMinimapHandle>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pausedAt, setPausedAt] = useState(0);
  const [selection, setSelection] = useState<Range | null>(null);
  const [view, setView] = useState<TimeView>({ start: 0, end: 0 });
  const [previewing, setPreviewing] = useState(false);
  const [snapToZero, setSnapToZero] = useState(true);
  const [skipCuts, setSkipCuts] = useState(true);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  useAudioPreviewGraph(audioRef, editList);
  const duration = editList.sourceDuration;
  const { data, status, localUrl, zeroCrossings } = useWaveformData(
    sourceUrl,
    serverPeaks,
    duration,
    onDuration,
  );
  const sampleRate = data?.sampleRate ?? FALLBACK_RATE;
  const minSpan = minSpanSec(sampleRate);
  const markers = useMemo(
    () => (editList.markers ?? []).map((marker) => marker.at),
    [editList.markers],
  );
  const kept = useMemo(
    () => keptDuration(editList.sourceDuration, editList.cuts),
    [editList.sourceDuration, editList.cuts],
  );

  const live = useRef({ selection, previewing, skipCuts, view, editList });
  live.current = { selection, previewing, skipCuts, view, editList };

  useEffect(() => {
    setView((current) =>
      current.end <= 0 || current.end > duration
        ? { start: 0, end: duration }
        : clampView(current, duration, minSpan),
    );
  }, [duration, minSpan]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !sourceUrl) {
      return;
    }
    // crossOrigin is required for the live plugin-preview graph (see
    // useAudioPreviewGraph): connecting a MediaElementAudioSourceNode to a
    // cross-origin source silently zeroes all audio output. If the source
    // doesn't serve CORS headers the browser refuses to load it at all, so
    // fall back to a plain load — playback works, live preview just won't
    // be audible for that source.
    audio.crossOrigin = 'anonymous';
    audio.src = sourceUrl;
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      setPausedAt(audio.currentTime);
    };
    const onSeeked = () => {
      if (audio.paused) {
        setPausedAt(audio.currentTime);
      }
    };
    const onError = () => {
      if (audio.crossOrigin) {
        audio.crossOrigin = null;
        audio.src = sourceUrl;
        audio.load();
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [sourceUrl]);

  // Once the decoder has downloaded the file, play from that copy: seeks
  // and replays then stop re-requesting byte ranges over the network. The
  // switch waits for a pause so playback never stutters.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !localUrl) {
      return;
    }
    const swap = () => {
      const at = audio.currentTime;
      const restore = () => {
        audio.currentTime = at;
      };
      audio.addEventListener('loadedmetadata', restore, { once: true });
      audio.src = localUrl;
    };
    if (audio.paused) {
      swap();
      return;
    }
    audio.addEventListener('pause', swap, { once: true });
    return () => audio.removeEventListener('pause', swap);
  }, [localUrl]);

  // While playing, one animation-frame loop moves the playhead, the
  // overview marker and the clock, skips cuts, stops a selection preview at
  // its end, and pages the view to follow playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!playing || !audio) {
      return;
    }
    let frame = 0;
    const tick = () => {
      const state = live.current;
      let t = audio.currentTime;
      const range = state.selection;
      if (state.previewing && range && t >= range.end) {
        audio.pause();
        audio.currentTime = range.end;
        t = range.end;
        setPreviewing(false);
      } else if (state.skipCuts && !state.previewing) {
        const cut = state.editList.cuts.find((c) => t >= c.start && t < c.end);
        if (cut) {
          audio.currentTime = cut.end;
          t = cut.end;
        }
      }
      waveRef.current?.setPlayhead(t);
      minimapRef.current?.setPlayhead(t);
      if (clockRef.current) {
        clockRef.current.textContent = formatClock(t, MS);
      }
      const followed = followPlayhead(state.view, duration, t, minSpan);
      if (followed !== state.view) {
        setView(followed);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, minSpan]);

  const currentTime = () => audioRef.current?.currentTime ?? pausedAt;

  const seek = (sec: number) => {
    const audio = audioRef.current;
    const t = Math.max(0, Math.min(duration, sec));
    if (audio) {
      audio.currentTime = t;
    }
    setPausedAt(t);
    setView((current) => followPlayhead(current, duration, t, minSpan));
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setPreviewing(false);
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
    setPreviewing(true);
    audio.currentTime = selection.start;
    void audio.play().catch(() => undefined);
  };

  const snap = (sec: number) => {
    if (!snapToZero || !data) {
      return sec;
    }
    // Up to 10 ms away, but never more than 1% of what is on screen, so a
    // deep zoom doesn't jump the edge visibly.
    const radius = Math.max(
      1,
      Math.min(
        data.sampleRate * 0.01,
        ((view.end - view.start) * data.sampleRate) / 100,
      ),
    );
    const sample = nearestZeroCrossing(data, sec * data.sampleRate, radius);
    if (sample !== null) {
      return sample / data.sampleRate;
    }
    if (data.exact) {
      return sec;
    }
    return (
      nearestListedCrossing(zeroCrossings, sec, radius / data.sampleRate) ?? sec
    );
  };

  const cutSelection = () => {
    if (!selection || selection.end - selection.start < MIN_REGION_SEC) {
      return;
    }
    onChange({ ...editList, cuts: mergeCuts([...editList.cuts, selection]) });
    setSelection(null);
    toast.info('Cut marked (removed on render).');
  };

  const trimToSelection = () => {
    if (!selection) {
      return;
    }
    onChange({
      ...editList,
      cuts: trimToRange(
        editList.cuts,
        editList.sourceDuration,
        selection.start,
        selection.end,
      ),
    });
    toast.info('Trimmed to selection (head/tail marked as cuts).');
  };

  const trimSilence = () => {
    if (!data || duration <= 0) {
      toast.info('No waveform loaded yet to trim.');
      return;
    }
    const range = audibleRange(data);
    if (!range) {
      toast.info('The whole file is below the silence threshold.');
      return;
    }
    const start = range.start / data.sampleRate;
    const end = range.end / data.sampleRate;
    const found = [
      ...(start > 0.05 ? [{ start: 0, end: start }] : []),
      ...(duration - end > 0.05 ? [{ start: end, end: duration }] : []),
    ];
    if (found.length === 0) {
      toast.info('No leading/trailing silence found.');
      return;
    }
    onChange({ ...editList, cuts: mergeCuts([...editList.cuts, ...found]) });
    toast.success('Trimmed leading/trailing silence (below -48 dBFS).');
  };

  const addFade = (type: 'in' | 'out') => {
    if (!selection || selection.end - selection.start < MIN_REGION_SEC) {
      return;
    }
    if (
      editList.cuts.some(
        (c) => selection.start >= c.start && selection.start < c.end,
      )
    ) {
      toast.error('A fade cannot start inside a cut.');
      return;
    }
    onChange({
      ...editList,
      fades: [
        ...editList.fades,
        {
          type,
          at: selection.start,
          duration: selection.end - selection.start,
          curve: 'tri' as const,
        },
      ].sort((a, b) => a.at - b.at),
    });
    toast.info(`Fade ${type} added (applied on render).`);
  };

  const addMarker = () => {
    const t = currentTime();
    const existing = editList.markers ?? [];
    if (existing.some((m) => Math.abs(m.at - t) < MS)) {
      return;
    }
    onChange({
      ...editList,
      markers: [...existing, { at: t }].sort((a, b) => a.at - b.at),
    });
  };

  const zoomBy = (factor: number) => {
    const t = currentTime();
    const anchor =
      t >= view.start && t <= view.end ? t : (view.start + view.end) / 2;
    setView(zoomAt(view, duration, anchor, factor, minSpan));
  };

  const showRange = (range: Range) => {
    setSelection(range);
    setView(viewForRange(range, duration, minSpan));
  };

  const ask = (next: Confirm) => setConfirm(next);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const span = view.end - view.start;
    const actions: Record<string, () => void> = {
      ' ': togglePlay,
      p: previewSelection,
      ArrowLeft: () => seek(currentTime() - span / (event.shiftKey ? 10 : 100)),
      ArrowRight: () =>
        seek(currentTime() + span / (event.shiftKey ? 10 : 100)),
      Home: () => seek(0),
      End: () => seek(duration),
      '+': () => zoomBy(0.5),
      '=': () => zoomBy(0.5),
      '-': () => zoomBy(2),
      '0': () => setView({ start: 0, end: duration }),
      z: () => selection && setView(viewForRange(selection, duration, minSpan)),
      Delete: cutSelection,
      Backspace: cutSelection,
      t: trimToSelection,
      i: () => addFade('in'),
      o: () => addFade('out'),
      m: addMarker,
      Escape: () => setSelection(null),
    };
    const action = actions[event.key] ?? actions[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const isZoomed = view.start > 0 || view.end < duration;
  const note = STATUS_NOTE[status];

  return (
    <>
      <StudioPanel className="!p-0">
        <WaveformToolbar
          playing={playing}
          hasSelection={selection !== null}
          hasCuts={editList.cuts.length > 0}
          isZoomed={isZoomed}
          canUndo={canUndo}
          canRedo={canRedo}
          snapToZero={snapToZero}
          skipCuts={skipCuts}
          onTogglePlay={togglePlay}
          onPreviewSelection={previewSelection}
          onUndo={onUndo}
          onRedo={onRedo}
          onCut={cutSelection}
          onTrim={trimToSelection}
          onTrimSilence={trimSilence}
          onFadeIn={() => addFade('in')}
          onFadeOut={() => addFade('out')}
          onClearCuts={() =>
            ask({
              title: 'Clear all cuts?',
              description: `Removes all ${editList.cuts.length} cut(s) from this draft. You can undo this.`,
              confirmLabel: 'Clear cuts',
              run: () => {
                onChange({ ...editList, cuts: [] });
                toast.success('Cuts cleared.');
              },
            })
          }
          onClearSelection={() => setSelection(null)}
          onAddMarker={addMarker}
          onZoomIn={() => zoomBy(0.5)}
          onZoomOut={() => zoomBy(2)}
          onZoomToSelection={() =>
            selection && setView(viewForRange(selection, duration, minSpan))
          }
          onZoomFit={() => setView({ start: 0, end: duration })}
          onSnapChange={setSnapToZero}
          onSkipCutsChange={setSkipCuts}
        />

        <div className="p-5 sm:p-6">
          <ProWaveform
            ref={waveRef}
            data={data}
            durationSec={duration}
            view={view}
            minSpan={minSpan}
            onViewChange={setView}
            overlay={{
              cuts: editList.cuts,
              fades: editList.fades,
              selection,
              markers,
            }}
            playhead={pausedAt}
            onSeek={seek}
            onSelect={setSelection}
            snap={snap}
            onKeyDown={onKeyDown}
          />

          <div className="mt-2">
            <ProMinimap
              ref={minimapRef}
              data={data}
              durationSec={duration}
              view={view}
              minSpan={minSpan}
              cuts={editList.cuts}
              playhead={pausedAt}
              onViewChange={setView}
            />
          </div>

          <div className="text-foreground-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
            <span>
              <span ref={clockRef}>{formatClock(pausedAt, MS)}</span> /{' '}
              {formatClock(duration, MS)}
            </span>
            <span>Kept {formatClock(kept, MS)}</span>
            <span>{editList.cuts.length} cut(s)</span>
            <span>
              View {formatClock(view.end - view.start, MS)}
              {data ? ` · ${data.sampleRate / 1000} kHz` : ''}
              {data?.exact ? ` · ${data.channels.length} ch` : ''}
            </span>
            {selection && (
              <span>
                Selection {formatClock(selection.start, MS)}–
                {formatClock(selection.end, MS)} (
                {formatClock(selection.end - selection.start, MS)})
              </span>
            )}
          </div>
          <p className="text-foreground-secondary mt-1 text-xs">
            {note ? `${note} ` : ''}Ctrl/⌘ + scroll or pinch to zoom, Shift +
            scroll to pan. Focus the waveform for keyboard shortcuts.
          </p>

          <RegionList
            cuts={editList.cuts}
            fades={editList.fades}
            markers={markers}
            onShowRange={showRange}
            onSeek={seek}
            onRemoveCut={(index) =>
              ask({
                title: 'Remove this cut?',
                description:
                  'The audio in it will be kept on render. You can undo this.',
                confirmLabel: 'Remove cut',
                run: () =>
                  onChange({
                    ...editList,
                    cuts: editList.cuts.filter((_, i) => i !== index),
                  }),
              })
            }
            onRemoveFade={(index) =>
              ask({
                title: 'Remove this fade?',
                description: 'You can undo this.',
                confirmLabel: 'Remove fade',
                run: () =>
                  onChange({
                    ...editList,
                    fades: editList.fades.filter((_, i) => i !== index),
                  }),
              })
            }
            onRemoveMarker={(index) =>
              ask({
                title: 'Remove this marker?',
                description: 'You can undo this.',
                confirmLabel: 'Remove marker',
                run: () =>
                  onChange({
                    ...editList,
                    markers: (editList.markers ?? []).filter(
                      (_, i) => i !== index,
                    ),
                  }),
              })
            }
            onClearMarkers={() =>
              ask({
                title: 'Clear all markers?',
                description: 'You can undo this.',
                confirmLabel: 'Clear markers',
                run: () => onChange({ ...editList, markers: [] }),
              })
            }
          />
        </div>
      </StudioPanel>
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <ConfirmDialog
        isOpen={confirm !== null}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      />
    </>
  );
}
