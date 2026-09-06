import { ActivityIcon, CheckCircle2Icon, Mic2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@tahti-player/ui';

import type { SignalStatus } from '../api/broadcast';

const METER_FLOOR_DBFS = -60;
const PEAK_HOLD_MS = 1500;

type SignalCheckWidgetProps = {
  signal: SignalStatus | null;
  analyser: AnalyserNode | null;
  isChecking: boolean;
  onCheckAudio: () => void;
  isMock: boolean;
  onTestConnection: () => void;
};

function dbfsFromTimeDomain(data: Uint8Array): number {
  let sumSquares = 0;
  for (const value of data) {
    const sample = (value - 128) / 128;
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / data.length);
  if (rms <= 0) {
    return METER_FLOOR_DBFS;
  }
  return Math.max(METER_FLOOR_DBFS, 20 * Math.log10(rms));
}

function dbfsToPercent(dbfs: number): number {
  return Math.min(
    100,
    Math.max(0, ((dbfs - METER_FLOOR_DBFS) / -METER_FLOOR_DBFS) * 100),
  );
}

function SignalMeter({
  analyser,
  label,
  active,
}: {
  analyser: AnalyserNode | null;
  label: string;
  active: boolean;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  const peakStateRef = useRef({ dbfs: METER_FLOOR_DBFS, heldAt: 0 });

  useEffect(() => {
    if (!analyser || !active) {
      if (fillRef.current) {
        fillRef.current.style.transform = 'scaleX(0)';
      }
      return;
    }

    let animationFrame = 0;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      const dbfs = dbfsFromTimeDomain(data);
      const now = performance.now();
      const peak = peakStateRef.current;
      if (dbfs >= peak.dbfs || now - peak.heldAt > PEAK_HOLD_MS) {
        peak.dbfs = dbfs;
        peak.heldAt = now;
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${dbfsToPercent(dbfs) / 100})`;
      }
      if (peakRef.current) {
        peakRef.current.textContent =
          peak.dbfs <= METER_FLOOR_DBFS
            ? 'peak — silent'
            : `peak ${peak.dbfs.toFixed(1)} dBFS`;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [active, analyser]);

  return (
    <div className="min-w-0 flex-1">
      <div className="text-foreground-secondary mb-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase">
        {label}
      </div>
      <div className="bg-border relative mb-1 h-2.5 overflow-hidden rounded-full">
        <div
          ref={fillRef}
          className="from-accent-green via-accent-green to-accent-red h-full origin-left rounded-full bg-gradient-to-r will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      <div
        ref={peakRef}
        className="text-foreground-secondary font-mono text-[0.65rem]"
      >
        peak — silent
      </div>
    </div>
  );
}

export const SignalCheckWidget = ({
  signal,
  analyser,
  isChecking,
  onCheckAudio,
  isMock,
  onTestConnection,
}: SignalCheckWidgetProps) => {
  const connected = Boolean(signal?.connected);
  const state = isChecking ? 'checking' : connected ? 'ready' : 'waiting';

  return (
    <div
      className={`border-border bg-background/40 rounded-lg border p-4 ${
        state === 'checking'
          ? 'border-accent-cyan/50 shadow-[0_0_24px_color-mix(in_srgb,var(--accent-cyan)_15%,transparent)]'
          : ''
      }`}
      data-testid="signal-check-widget"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-background-secondary text-primary relative flex size-10 shrink-0 items-center justify-center rounded-full">
          <Mic2Icon size={21} aria-hidden />
          <span className="ring-background bg-accent-yellow absolute right-0 bottom-0 size-2.5 rounded-full ring-2" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {state === 'waiting'
              ? 'Waiting for your signal…'
              : state === 'checking'
                ? 'Listening — that’s really you!'
                : 'You’re connected!'}
          </p>
          <p className="text-foreground-secondary mt-1 text-xs">
            {state === 'waiting'
              ? 'Start streaming in OBS, Mixxx, or Traktor — we’ll pick it up automatically.'
              : state === 'checking'
                ? 'Talk or play something — watch the bars move below.'
                : 'Check your own audio and levels before you go live.'}
          </p>
        </div>
        {connected && (
          <Button size="sm" variant="secondary" onClick={onCheckAudio}>
            {isChecking ? 'Stop listening' : 'Check my audio'}
          </Button>
        )}
        {isMock && !connected && (
          <Button size="sm" variant="secondary" onClick={onTestConnection}>
            Test connection
          </Button>
        )}
      </div>

      {isChecking && (
        <div className="border-border/70 mt-4 flex gap-4 border-t pt-3">
          <SignalMeter analyser={analyser} label="Input level · L" active />
          <SignalMeter analyser={analyser} label="Input level · R" active />
        </div>
      )}

      {!connected && !isMock && (
        <div className="text-foreground-secondary mt-3 flex items-center gap-2 text-xs">
          <ActivityIcon size={14} aria-hidden />
          This dashboard checks your signal every four seconds.
        </div>
      )}
      {connected && !isChecking && (
        <div className="text-primary mt-3 flex items-center gap-2 text-xs">
          <CheckCircle2Icon size={14} aria-hidden />
          {signal?.codec ?? 'Audio'}
          {signal?.bitrateKbps != null ? ` · ${signal.bitrateKbps} kbps` : ''}
        </div>
      )}
    </div>
  );
};
