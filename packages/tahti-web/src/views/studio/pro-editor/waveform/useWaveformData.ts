import { useEffect, useMemo, useRef, useState } from 'react';

import type { EditorDraft } from '../../../../api/studio-types';
import {
  buildWaveformData,
  waveformFromFinePeaks,
  waveformFromServerPyramid,
} from './peaks';
import type { WaveformData } from './peaks';
import { sniffSampleRate } from './sampleRate';

export type EditorPeaks = NonNullable<EditorDraft['editorPeaks']>;

/** Longest source decoded in the browser. Past this only the server's
 * overview peaks are shown (decoding holds the whole file in memory). */
export const MAX_DECODE_SEC = 30 * 60;

/** Most samples (all channels) kept for sample-level zoom — about 400 MB
 * of float32, roughly 35 min of 48 kHz stereo. Longer decodes keep only
 * the summaries (256 samples per block). */
export const RAW_SAMPLE_BUDGET = 100_000_000;

const FALLBACK_RATE = 48000;

export type WaveformStatus =
  'idle' | 'decoding' | 'exact' | 'fine' | 'overview-only' | 'failed';

const nextFrame = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

/** Waveform data for the editor: the server's peaks right away, replaced by
 * a sample-accurate pyramid decoded from the source at its own sample rate
 * (no resampling) once the file has loaded. `onDuration` reports the
 * decoded length so a draft with no duration can adopt it. */
export function useWaveformData(
  sourceUrl: string | null,
  serverPeaks: EditorPeaks | null,
  durationSec: number,
  onDuration: (seconds: number) => void,
) {
  const [decoded, setDecoded] = useState<WaveformData | null>(null);
  const [status, setStatus] = useState<WaveformStatus>('idle');
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const onDurationRef = useRef(onDuration);
  onDurationRef.current = onDuration;

  const placeholder = useMemo(
    () =>
      serverPeaks ? waveformFromServerPyramid(serverPeaks, durationSec) : null,
    [serverPeaks, durationSec],
  );
  const hasPlaceholder = placeholder !== null;
  const fine = serverPeaks?.fine ?? null;
  const tooLong = hasPlaceholder && durationSec > MAX_DECODE_SEC;

  useEffect(() => {
    setDecoded(null);
    setLocalUrl(null);
    if (!sourceUrl) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    // Long sources: the server's 10 ms min/max peaks instead of a decode.
    const loadFine = async () => {
      if (!fine) {
        return false;
      }
      try {
        const res = await fetch(fine.url);
        if (!res.ok) {
          return false;
        }
        const bytes = new Int8Array(await res.arrayBuffer());
        const data = waveformFromFinePeaks(
          bytes,
          fine.channels,
          fine.bucketsPerSec,
        );
        if (cancelled || !data) {
          return false;
        }
        setDecoded(data);
        setStatus('fine');
        return true;
      } catch {
        return false;
      }
    };

    if (tooLong) {
      if (!fine) {
        // Nothing to load: the server's overview peaks are all there is.
        setStatus('overview-only');
        return;
      }
      setStatus('decoding');
      void loadFine().then((loaded) => {
        if (!loaded && !cancelled) {
          setStatus('overview-only');
        }
      });
      return () => {
        cancelled = true;
      };
    }
    setStatus('decoding');
    void (async () => {
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buffer = await res.arrayBuffer();
        if (cancelled) {
          return;
        }
        // Copied before decoding (which detaches the buffer), so playback
        // can switch to the already-downloaded file instead of streaming
        // it a second time.
        objectUrl = URL.createObjectURL(
          new Blob([buffer], {
            type: res.headers.get('content-type') ?? 'audio/mpeg',
          }),
        );
        setLocalUrl(objectUrl);
        const sampleRate = sniffSampleRate(buffer) ?? FALLBACK_RATE;
        const OfflineCtx =
          window.OfflineAudioContext ??
          (
            window as unknown as {
              webkitOfflineAudioContext?: typeof OfflineAudioContext;
            }
          ).webkitOfflineAudioContext;
        if (!OfflineCtx) {
          throw new Error('No Web Audio');
        }
        const audio = await new OfflineCtx(1, 1, sampleRate).decodeAudioData(
          buffer,
        );
        if (cancelled) {
          return;
        }
        onDurationRef.current(audio.duration);
        const channels = Array.from(
          { length: audio.numberOfChannels },
          (_, i) => audio.getChannelData(i),
        );
        await nextFrame();
        if (cancelled) {
          return;
        }
        const keepRaw = audio.length * channels.length <= RAW_SAMPLE_BUDGET;
        setDecoded(buildWaveformData(channels, audio.sampleRate, keepRaw));
        setStatus('exact');
      } catch {
        if (!cancelled && !(await loadFine()) && !cancelled) {
          setStatus(hasPlaceholder ? 'overview-only' : 'failed');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sourceUrl, tooLong, hasPlaceholder, fine?.url]);

  return {
    data: decoded ?? placeholder,
    status,
    /** The downloaded source as a blob URL, once fetched. */
    localUrl,
    zeroCrossings: serverPeaks?.zeroCrossingsSec ?? [],
  };
}
