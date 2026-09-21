import {
  CropIcon,
  MapPinIcon,
  Maximize2Icon,
  PauseIcon,
  PlayIcon,
  ScissorsIcon,
  Trash2Icon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

import type { EditList } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { WaveformCanvas } from '../../../components/WaveformCanvas';
import { WaveformMinimap } from '../../../components/WaveformMinimap';
import { useAudioPreviewGraph } from '../../../lib/audioPreviewGraph';
import {
  keptDuration,
  mergeCuts,
  silenceCuts,
  trimToRange,
  zoomRange,
} from './editCuts';
import { formatTime } from './pluginUi';
import { useWaveformPeaks } from './useWaveformPeaks';

type Props = {
  sourceUrl: string | null;
  serverPeaks: number[];
  editList: EditList;
  onChange: (next: EditList) => void;
  /** Reports a duration learned from decoding, for drafts without one. */
  onDuration: (seconds: number) => void;
};

const Divider = () => <div className="bg-border mx-1 h-6 w-px" aria-hidden />;

/** The waveform, its transport/cut/zoom toolbar and the audio element.
 * Owns playback state so a `timeupdate` re-renders only this panel, not the
 * mastering/stems/export panels around it. */
export function WaveformEditor({
  sourceUrl,
  serverPeaks,
  editList,
  onChange,
  onDuration,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(1);
  const [previewingSelection, setPreviewingSelection] = useState(false);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const previewingRef = useRef(previewingSelection);
  previewingRef.current = previewingSelection;

  useAudioPreviewGraph(audioRef, editList);
  const peaks = useWaveformPeaks(sourceUrl, serverPeaks, onDuration);

  const duration = editList.sourceDuration;
  const kept = useMemo(
    () => keptDuration(editList.sourceDuration, editList.cuts),
    [editList.sourceDuration, editList.cuts],
  );

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
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      const range = selectionRef.current;
      if (previewingRef.current && range && audio.currentTime >= range.end) {
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
      audio.pause();
    };
  }, [sourceUrl]);

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
    if (!selection || selection.end - selection.start < 0.05) {
      return;
    }
    onChange({
      ...editList,
      cuts: mergeCuts([...editList.cuts, selection]),
    });
    setSelection(null);
    toast.info('Cut region marked (removed on render).');
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

  const clearCuts = () => {
    onChange({ ...editList, cuts: [] });
    toast.info('Cuts cleared.');
  };

  const trimSilence = () => {
    if (peaks.length === 0 || editList.sourceDuration <= 0) {
      toast.info('No waveform loaded yet to trim.');
      return;
    }
    const found = silenceCuts(peaks, editList.sourceDuration);
    if (found.length === 0) {
      toast.info('No leading/trailing silence found.');
      return;
    }
    onChange({ ...editList, cuts: mergeCuts([...editList.cuts, ...found]) });
    toast.success('Trimmed leading/trailing silence.');
  };

  const zoomBy = (factor: number) => {
    const [start, end] = zoomRange(viewStart, viewEnd, factor);
    setViewStart(start);
    setViewEnd(end);
  };

  const addMarker = () =>
    setMarkers((current) =>
      current.some((m) => Math.abs(m - currentTime) < 0.05)
        ? current
        : [...current, currentTime].sort((a, b) => a - b),
    );

  const readout = (
    <>
      <span>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <span>Kept: {formatTime(kept)}</span>
      <span>{editList.cuts.length} cut(s)</span>
    </>
  );

  return (
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

          <Divider />

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

          <Divider />

          <Tooltip content="Add marker at playhead" side="top">
            <Button
              size="icon-sm"
              variant="text"
              onClick={addMarker}
              aria-label="Add marker at playhead"
            >
              <MapPinIcon size={16} aria-hidden />
            </Button>
          </Tooltip>

          <Divider />

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
            {readout}
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
            {readout}
          </div>
          {selection && (
            <div className="text-foreground-secondary mt-1 text-xs">
              Selection {formatTime(selection.start)}–
              {formatTime(selection.end)}
            </div>
          )}

          {markers.length > 0 && (
            <div className="text-foreground-secondary mt-3 flex flex-wrap items-center gap-2 text-xs">
              Markers:
              {markers.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant="secondary"
                  onClick={() => seek(m)}
                >
                  {formatTime(m)}
                </Button>
              ))}
              <Button size="sm" variant="text" onClick={() => setMarkers([])}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </StudioPanel>
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </>
  );
}
