import { useEffect, useState } from 'react';

const BUCKETS = 256;

/** Peaks for the waveform: the server's when it has them, else decoded from
 * the source in the browser (the canvas falls back to a synthetic waveform
 * while neither is available). `onDuration` reports the decoded length so a
 * draft with no duration can adopt it. */
export function useWaveformPeaks(
  sourceUrl: string | null,
  serverPeaks: number[],
  onDuration: (seconds: number) => void,
) {
  const [decoded, setDecoded] = useState<number[]>([]);
  const peaks = serverPeaks.length > 0 ? serverPeaks : decoded;

  useEffect(() => {
    setDecoded([]);
  }, [sourceUrl]);

  useEffect(() => {
    if (!sourceUrl || serverPeaks.length > 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      let ctx: AudioContext | null = null;
      try {
        const res = await fetch(sourceUrl);
        if (!res.ok) {
          return;
        }
        const buf = await res.arrayBuffer();
        ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf.slice(0));
        if (cancelled) {
          return;
        }
        const channel = audio.getChannelData(0);
        const block = Math.floor(channel.length / BUCKETS) || 1;
        const next: number[] = [];
        for (let i = 0; i < BUCKETS; i++) {
          let peak = 0;
          const start = i * block;
          for (let j = 0; j < block && start + j < channel.length; j++) {
            peak = Math.max(peak, Math.abs(channel[start + j]!));
          }
          next.push(peak);
        }
        const max = Math.max(...next, 0.001);
        setDecoded(next.map((v) => v / max));
        onDuration(audio.duration);
      } catch {
        // Keep the synthetic waveform fallback in WaveformCanvas.
      } finally {
        // Browsers cap live AudioContexts; a failed decode used to leak one.
        void ctx?.close().catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceUrl, serverPeaks.length]);

  return peaks;
}
