import {
  MinusIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ScissorsIcon,
  UploadIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  FxChainList,
  RackEffectPanel,
  type ChainEntry,
} from '@tahti-player/audio-rack';
import {
  Alert,
  Button,
  buttonVariants,
  cn,
  EmptyState,
  FilePicker,
  SegmentedControl,
  Slider,
} from '@tahti-player/ui';

import {
  initEditorAutosave,
  useAutosaveRecoveryStore,
} from '../lib/editorAutosave';
import { createMidiClip, isMidiClip } from '../midi/midiClip';
import { MidiClipPanel } from '../midi/MidiClipPanel';
import {
  computePeaks,
  useEditorStore,
  ZOOM_MAX,
  ZOOM_MIN,
  type AudioClip,
  type EditorTrack,
} from '../state/editorStore';
import * as liveMixer from '../state/liveMixer';
import { TrackAutomationLane } from './TrackAutomationLane';

export type MultitrackEditorProps = {
  className?: string;
  onBounce?: (blob: Blob) => void | Promise<void>;
  showVizSlot?: boolean;
  vizSlot?: ReactNode;
};

function TrackFaders({
  track,
  onSelect,
}: {
  track: EditorTrack;
  onSelect: () => void;
}) {
  const updateTrack = useEditorStore((s) => s.updateTrack);

  return (
    <div
      className="border-border flex w-44 shrink-0 flex-col gap-1.5 border-r p-2 text-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="truncate text-left font-semibold hover:underline"
        onClick={onSelect}
      >
        {track.name}
      </button>
      <div
        className="w-full"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Slider
          value={Math.round(track.volume * 100)}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => {
            updateTrack(track.id, { volume: v / 100 });
            liveMixer.syncMixerParams();
          }}
          formatValue={(v) => `${v}%`}
        >
          <Slider.Header label="Volume" showValue />
          <Slider.Surface>
            <Slider.Track />
            <Slider.RangeInput />
          </Slider.Surface>
        </Slider>
      </div>
      <div
        className="w-full"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Slider
          value={Math.round(((track.pan + 1) / 2) * 100)}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => {
            updateTrack(track.id, { pan: v / 50 - 1 });
            liveMixer.syncMixerParams();
          }}
          formatValue={(v) => {
            const pan = v / 50 - 1;
            if (Math.abs(pan) < 0.05) {
              return 'C';
            }
            return pan < 0
              ? `L${Math.round(-pan * 100)}`
              : `R${Math.round(pan * 100)}`;
          }}
        >
          <Slider.Header label="Pan" showValue />
          <Slider.Surface>
            <Slider.Track />
            <Slider.RangeInput />
          </Slider.Surface>
        </Slider>
      </div>
    </div>
  );
}

function ClipBar({
  clips,
  track,
  pxPerSec,
  selectedClipId,
  onSelectClip,
}: {
  clips: AudioClip[];
  track: EditorTrack;
  pxPerSec: number;
  selectedClipId: string | null;
  onSelectClip: (id: string) => void;
}) {
  const updateClip = useEditorStore((s) => s.updateClip);
  const dragRef = useRef<{
    clipId: string;
    startX: number;
    originStartSec: number;
  } | null>(null);

  const onPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    clip: AudioClip,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelectClip(clip.id);
    dragRef.current = {
      clipId: clip.id,
      startX: e.clientX,
      originStartSec: clip.startSec,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const deltaSec = (e.clientX - drag.startX) / pxPerSec;
    const next = Math.max(0, drag.originStartSec + deltaSec);
    updateClip(drag.clipId, { startSec: next });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      dragRef.current = null;
    }
  };

  return (
    <div className="relative h-14 border-b" style={{ minWidth: 800 }}>
      {clips.map((clip) => {
        const peaks = clip.peaks?.length ? clip.peaks : [];
        const selected = selectedClipId === clip.id;
        return (
          <div
            key={clip.id}
            role="button"
            tabIndex={0}
            aria-label={`Clip ${clip.label || clip.id}`}
            aria-pressed={selected}
            className={cn(
              'absolute top-1 bottom-1 cursor-grab overflow-hidden rounded border active:cursor-grabbing',
              selected
                ? 'border-primary ring-primary/40 ring-2'
                : 'border-border',
            )}
            style={{
              left: clip.startSec * pxPerSec,
              width: Math.max(4, clip.durationSec * pxPerSec),
              background: track.color || '#3b82f6',
              opacity: clip.muted ? 0.4 : 0.85,
            }}
            title={isMidiClip(clip) ? `${clip.label} (MIDI)` : clip.label}
            onPointerDown={(e) => onPointerDown(e, clip)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectClip(clip.id);
              }
            }}
          >
            <canvas
              width={Math.max(1, Math.floor(clip.durationSec * pxPerSec))}
              height={48}
              className="pointer-events-none"
              ref={(canvas) => {
                if (!canvas || !peaks.length) {
                  return;
                }
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  return;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                const mid = canvas.height / 2;
                for (let i = 0; i < peaks.length; i++) {
                  const x = (i / peaks.length) * canvas.width;
                  const h = (peaks[i] ?? 0) * mid;
                  ctx.fillRect(x, mid - h, 1, h * 2);
                }
              }}
            />
            {isMidiClip(clip) ? (
              <span className="pointer-events-none absolute top-0.5 left-1 text-[10px] font-semibold text-white/90">
                MIDI · {clip.sourcePianoRoll?.length ?? 0}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function MultitrackEditor({
  className,
  onBounce,
  showVizSlot,
  vizSlot,
}: MultitrackEditorProps) {
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const bpm = useEditorStore((s) => s.bpm);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelected = useEditorStore((s) => s.setSelected);
  const splitClipAt = useEditorStore((s) => s.splitClipAt);
  const masterFxChain = useEditorStore((s) => s.masterFxChain);
  const addTrack = useEditorStore((s) => s.addTrack);
  const addClipToTrack = useEditorStore((s) => s.addClipToTrack);
  const addTrackEffect = useEditorStore((s) => s.addTrackEffect);
  const removeTrackEffect = useEditorStore((s) => s.removeTrackEffect);
  const updateTrackEffectParams = useEditorStore(
    (s) => s.updateTrackEffectParams,
  );
  const toggleTrackEffect = useEditorStore((s) => s.toggleTrackEffect);
  const addMasterEffect = useEditorStore((s) => s.addMasterEffect);
  const removeMasterEffect = useEditorStore((s) => s.removeMasterEffect);
  const updateMasterEffectParams = useEditorStore(
    (s) => s.updateMasterEffectParams,
  );
  const toggleMasterEffect = useEditorStore((s) => s.toggleMasterEffect);

  const [playing, setPlaying] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedFxId, setSelectedFxId] = useState<string | null>(null);
  const [fxScope, setFxScope] = useState<'track' | 'master'>('track');
  const [busy, setBusy] = useState(false);
  const fileId = useId();
  const pxPerSec = zoom;

  const offer = useAutosaveRecoveryStore((s) => s.offer);
  const restore = useAutosaveRecoveryStore((s) => s.restore);
  const discard = useAutosaveRecoveryStore((s) => s.discard);

  useEffect(() => {
    initEditorAutosave();
  }, []);

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedTrackId) ?? tracks[0] ?? null,
    [tracks, selectedTrackId],
  );

  const activeChain: ChainEntry[] = useMemo(() => {
    if (fxScope === 'master') {
      return masterFxChain as ChainEntry[];
    }
    return (selectedTrack?.fxChain ?? []) as ChainEntry[];
  }, [fxScope, masterFxChain, selectedTrack]);

  const selectedEntry = activeChain.find((e) => e.id === selectedFxId) ?? null;

  const onImportFiles = useCallback(
    async (files: FileList | readonly File[] | null) => {
      if (!files?.length) {
        return;
      }
      setBusy(true);
      try {
        for (const file of Array.from(files)) {
          const audioBlob = file.slice(0, file.size, file.type || 'audio/wav');
          const { peaks, duration } = await computePeaks(audioBlob, 240);
          let trackId = selectedTrack?.id;
          if (!trackId) {
            trackId = addTrack({ name: file.name });
          }
          addClipToTrack({
            trackId: trackId!,
            startSec: playheadSec,
            durationSec: duration,
            offsetIntoSource: 0,
            sourceDuration: duration,
            audioBlob,
            mimeType: file.type || 'audio/wav',
            peaks,
            label: file.name,
            color: '#3b82f6',
            sourceKind: 'audio',
          });
          setSelectedTrackId(trackId!);
        }
      } finally {
        setBusy(false);
      }
    },
    [addClipToTrack, addTrack, playheadSec, selectedTrack],
  );

  const togglePlay = async () => {
    if (playing) {
      liveMixer.stop();
      setPlaying(false);
      return;
    }
    await liveMixer.play();
    setPlaying(true);
  };

  const doBounce = async () => {
    if (!onBounce) {
      return;
    }
    setBusy(true);
    try {
      const blob = await liveMixer.bounceMixdown();
      if (!blob) {
        window.alert('Nothing to bounce — add audio clips first.');
        return;
      }
      await onBounce(blob);
    } finally {
      setBusy(false);
    }
  };

  const addMidiClip = () => {
    const trackId = selectedTrack?.id ?? addTrack({ name: 'MIDI' });
    const id = addClipToTrack(
      createMidiClip({ trackId, startSec: playheadSec, bpm }),
    );
    setSelected(id);
    setSelectedTrackId(trackId);
  };

  const selectedMidiClipId = clips.some(
    (c) => c.id === selectedClipId && isMidiClip(c),
  )
    ? selectedClipId
    : null;

  const doSplit = () => {
    if (!selectedClipId) {
      return;
    }
    splitClipAt(selectedClipId, playheadSec);
  };

  return (
    <div
      className={cn(
        'border-border bg-background-secondary/30 flex h-full min-h-96 flex-col gap-3 overflow-hidden rounded-xl border p-3',
        className,
      )}
    >
      {offer ? (
        <Alert tone="info" title="Recover previous editor session?">
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void restore()}>
              Restore
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void discard()}
            >
              Discard
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => void togglePlay()}
          disabled={busy}
          aria-label={playing ? 'Stop playback' : 'Play'}
        >
          {playing ? (
            <PauseIcon size={15} aria-hidden />
          ) : (
            <PlayIcon size={15} aria-hidden />
          )}
          <span className="ml-1.5">{playing ? 'Stop' : 'Play'}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => addTrack()}
          disabled={busy}
        >
          <PlusIcon size={15} aria-hidden className="mr-1.5" />
          Add track
        </Button>
        {tracks.length > 0 ? (
          <>
            <label
              htmlFor={fileId}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'ghost' }),
                busy && 'pointer-events-none opacity-50',
              )}
            >
              <UploadIcon size={15} aria-hidden className="mr-1.5" />
              Import audio
            </label>
            <input
              id={fileId}
              name="import-audio"
              type="file"
              accept="audio/*"
              multiple
              disabled={busy}
              className="sr-only"
              onChange={(e) => void onImportFiles(e.target.files)}
            />
          </>
        ) : null}
        <Button size="sm" variant="ghost" disabled={busy} onClick={addMidiClip}>
          <MusicIcon size={15} aria-hidden className="mr-1.5" />
          Add MIDI clip
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!selectedClipId || busy}
          onClick={doSplit}
          aria-label="Split selected clip at playhead"
        >
          <ScissorsIcon size={15} aria-hidden className="mr-1.5" />
          Split
        </Button>
        <div className="border-border flex items-center gap-1 rounded-md border px-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom out"
            disabled={busy || zoom <= ZOOM_MIN}
            onClick={() => setZoom(zoom / 1.25)}
          >
            <MinusIcon size={14} aria-hidden />
          </Button>
          <span className="text-foreground-secondary min-w-12 text-center font-mono text-xs tabular-nums">
            {Math.round(zoom)} px/s
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom in"
            disabled={busy || zoom >= ZOOM_MAX}
            onClick={() => setZoom(zoom * 1.25)}
          >
            <PlusIcon size={14} aria-hidden />
          </Button>
        </div>
        {onBounce ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void doBounce()}
            disabled={busy}
          >
            Bounce
          </Button>
        ) : null}
        <span className="text-foreground-secondary ml-auto font-mono text-xs tabular-nums">
          {playheadSec.toFixed(2)}s · {bpm} BPM · {tracks.length} tracks
        </span>
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1 gap-3',
          showVizSlot ? 'lg:grid-cols-[1fr_280px]' : 'grid-cols-1',
        )}
      >
        <div className="border-border bg-background flex min-w-0 flex-col overflow-auto rounded-lg border">
          {tracks.length === 0 ? (
            <EmptyState
              size="sm"
              title="No tracks yet"
              description="Import audio or add a track to begin arranging."
              action={
                <FilePicker
                  className="max-w-md"
                  accept="audio/*"
                  multiple
                  disabled={busy}
                  labels={{
                    title: 'Audio file',
                    description: 'WAV, FLAC, AIFF, or MP3',
                    browse: 'Choose audio',
                  }}
                  onFiles={(files) => void onImportFiles(files)}
                />
              }
            />
          ) : (
            tracks.map((track) => {
              const selected = selectedTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={cn('flex', selected && 'bg-primary/5')}
                >
                  <div className={cn(selected && 'bg-primary/15 text-primary')}>
                    <TrackFaders
                      track={track}
                      onSelect={() => {
                        setSelectedTrackId(track.id);
                        setFxScope('track');
                      }}
                    />
                  </div>
                  <div className="relative flex-1 overflow-x-auto">
                    <ClipBar
                      track={track}
                      clips={clips.filter((c) => c.trackId === track.id)}
                      pxPerSec={pxPerSec}
                      selectedClipId={selectedClipId}
                      onSelectClip={(id) => {
                        setSelected(id);
                        setSelectedTrackId(track.id);
                        setFxScope('track');
                      }}
                    />
                    <TrackAutomationLane
                      track={track}
                      clips={clips.filter((c) => c.trackId === track.id)}
                      pxPerSec={pxPerSec}
                    />
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 w-px bg-red-500"
                      style={{ left: playheadSec * pxPerSec }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
        {showVizSlot ? (
          <div className="min-h-48 overflow-hidden">{vizSlot}</div>
        ) : null}
      </div>

      {selectedMidiClipId ? (
        <MidiClipPanel clipId={selectedMidiClipId} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border-border bg-background rounded-lg border p-3">
          <div className="mb-3">
            <SegmentedControl<'track' | 'master'>
              aria-label="Effect scope"
              value={fxScope}
              onChange={setFxScope}
              options={[
                { id: 'track', label: 'Track FX' },
                { id: 'master', label: 'Master FX' },
              ]}
            />
          </div>
          <FxChainList
            chain={activeChain}
            selectedId={selectedFxId}
            onSelect={setSelectedFxId}
            onAdd={(effectId) => {
              if (fxScope === 'master') {
                addMasterEffect(effectId);
              } else if (selectedTrack) {
                addTrackEffect(selectedTrack.id, effectId);
              }
            }}
            onRemove={(entryId) => {
              if (fxScope === 'master') {
                removeMasterEffect(entryId);
              } else if (selectedTrack) {
                removeTrackEffect(selectedTrack.id, entryId);
              }
            }}
          />
        </div>
        <div className="border-border bg-background rounded-lg border p-3">
          {selectedEntry ? (
            <RackEffectPanel
              entry={selectedEntry}
              onToggleEnabled={() => {
                if (fxScope === 'master') {
                  toggleMasterEffect(selectedEntry.id);
                } else if (selectedTrack) {
                  toggleTrackEffect(selectedTrack.id, selectedEntry.id);
                }
              }}
              onChangeParams={(params) => {
                if (fxScope === 'master') {
                  updateMasterEffectParams(selectedEntry.id, params);
                } else if (selectedTrack) {
                  updateTrackEffectParams(
                    selectedTrack.id,
                    selectedEntry.id,
                    params,
                  );
                }
                liveMixer.syncMixerParams();
              }}
            />
          ) : (
            <EmptyState
              size="sm"
              title="No effect selected"
              description="Select an effect in the chain to edit parameters."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export async function loadBlobOntoNewTrack(
  blob: Blob,
  name: string,
  color = '#3b82f6',
): Promise<string> {
  const { peaks, duration } = await computePeaks(blob, 240);
  const trackId = useEditorStore.getState().addTrack({ name, color });
  useEditorStore.getState().addClipToTrack({
    trackId,
    startSec: 0,
    durationSec: duration,
    offsetIntoSource: 0,
    sourceDuration: duration,
    audioBlob: blob,
    mimeType: blob.type || 'audio/wav',
    peaks,
    label: name,
    color,
    sourceKind: 'audio',
  });
  return trackId;
}

const STEM_LANE_COLORS: Record<string, string> = {
  vocals: '#ef4444',
  vocal: '#ef4444',
  instrumental: '#3b82f6',
  drums: '#f59e0b',
  drum: '#f59e0b',
  bass: '#8b5cf6',
  other: '#10b981',
};

export function colorForStemLabel(label: string): string {
  const key = label.trim().toLowerCase();
  return STEM_LANE_COLORS[key] ?? '#64748b';
}

/** Replace the arrange with one lane per stem file (start at 0). */
export async function loadStemFilesOntoMultitrack(
  files: Array<{ label: string; blob: Blob }>,
): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }
  useEditorStore.getState().loadProject({ tracks: [], clips: [] });
  const trackIds: string[] = [];
  for (const file of files) {
    const id = await loadBlobOntoNewTrack(
      file.blob,
      file.label,
      colorForStemLabel(file.label),
    );
    trackIds.push(id);
  }
  return trackIds;
}
