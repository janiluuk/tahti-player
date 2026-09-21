import {
  ActivityIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@tahti-player/ui';

import type {
  NativeAnalysisProgress,
  NativeAnalysisResult,
  NativeAnalysisSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

/** Toast text for a finished (or cancelled) analysis run. */
export function analysisResultMessage(result: NativeAnalysisResult): string {
  const parts = [`${result.analyzed} analyzed`];
  if (result.reused > 0) {
    parts.push(`${result.reused} already done`);
  }
  if (result.failed > 0) {
    parts.push(`${result.failed} could not be read`);
  }
  return parts.join(', ');
}

/**
 * Runs analysis on `ids` (the whole library when empty) and reports through
 * toasts. Shared by the library-wide control and the selection toolbar.
 */
export async function runAnalysis(
  library: TahtiNativeLibrary,
  ids: string[],
  force = false,
): Promise<NativeAnalysisResult | null> {
  try {
    const result = await library.analysis.analyze(ids, force);
    if (result.cancelled) {
      toast.message('Analysis stopped.', {
        description: `${analysisResultMessage(result)}. Run it again to continue where it left off.`,
      });
    } else {
      toast.success('Analysis finished.', {
        description: analysisResultMessage(result),
      });
    }
    return result;
  } catch (failure) {
    toast.error(
      failure instanceof Error ? failure.message : 'Could not analyze.',
    );
    return null;
  }
}

type Props = {
  library: TahtiNativeLibrary;
  onChanged: () => void;
};

/**
 * Library-wide analysis: how much is analyzed, plus start / pause / stop for
 * the background job. One track is decoded at a time, so playback is not
 * starved; results are saved per track, so stopping loses nothing.
 */
export function LocalLibraryAnalysis({ library, onChanged }: Props) {
  const [summary, setSummary] = useState<NativeAnalysisSummary | null>(null);
  const [progress, setProgress] = useState<NativeAnalysisProgress | null>(null);
  const [starting, setStarting] = useState(false);
  const [paused, setPaused] = useState(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await library.analysis.summary();
      if (alive.current) {
        setSummary(next);
        setPaused(next.paused);
      }
    } catch {
      // The summary is informational; the controls still work without it.
    }
  }, [library]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const stop = library.analysis.onProgress((next) => {
      if (alive.current) {
        setProgress(next);
      }
    });
    return () => {
      alive.current = false;
      stop();
    };
  }, [library, refresh]);

  const running = starting || summary?.running === true;

  const start = async (force: boolean) => {
    setStarting(true);
    setProgress(null);
    try {
      await runAnalysis(library, [], force);
    } finally {
      if (alive.current) {
        setStarting(false);
        setPaused(false);
        setProgress(null);
      }
      onChanged();
      void refresh();
    }
  };

  const togglePause = async () => {
    const next = !paused;
    setPaused(next);
    try {
      await library.analysis.pause(next);
    } catch (failure) {
      setPaused(!next);
      toast.error(
        failure instanceof Error ? failure.message : 'Could not pause.',
      );
    }
  };

  const remaining = summary ? summary.total - summary.analyzed : 0;
  return (
    <div
      className="border-border flex flex-wrap items-center gap-1 rounded-md border p-2"
      data-testid="library-analysis"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">Audio analysis</p>
        <p className="text-foreground-secondary truncate text-xs" role="status">
          {running && progress
            ? `${paused ? 'Paused' : 'Analyzing'} ${Math.min(progress.done + 1, progress.total)} of ${progress.total}${progress.currentTitle ? ` — ${progress.currentTitle}` : ''}`
            : summary
              ? `${summary.analyzed.toLocaleString('en-US')} of ${summary.total.toLocaleString('en-US')} tracks analyzed (waveform, loudness, BPM, key)`
              : 'Waveform, loudness, BPM and key'}
        </p>
      </div>
      {running ? (
        <>
          <Button size="sm" variant="text" onClick={() => void togglePause()}>
            {paused ? (
              <PlayIcon size={14} aria-hidden />
            ) : (
              <PauseIcon size={14} aria-hidden />
            )}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            size="sm"
            variant="text"
            onClick={() => void library.analysis.cancel()}
          >
            <XIcon size={14} aria-hidden />
            Stop
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="text"
          disabled={summary !== null && remaining === 0}
          onClick={() => void start(false)}
        >
          <ActivityIcon size={14} aria-hidden />
          {summary && summary.analyzed > 0 && remaining > 0
            ? `Analyze ${remaining.toLocaleString('en-US')} remaining`
            : 'Analyze library'}
        </Button>
      )}
      {starting && !progress ? (
        <LoaderCircleIcon
          size={14}
          className="animate-spin"
          aria-label="Starting"
        />
      ) : null}
    </div>
  );
}
