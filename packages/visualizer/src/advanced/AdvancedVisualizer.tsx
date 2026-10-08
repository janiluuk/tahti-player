import { Maximize2, Minimize2, Target, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import {
  getAnalyser,
  getEngineCtx,
  samplePeakAndRMS,
} from '@tahti-player/audio-core';

import { fitCanvas } from '../canvasScale';
import { QuantumLatticeView } from './QuantumLatticeView';

export type AdvancedMode = 'oscilloscope' | 'spectrum' | 'radial' | 'quantum';

const OVERLAY_RESERVE_HEIGHT = 18;

const formatDb = (db: number): string => {
  if (!Number.isFinite(db)) {
    return '−∞';
  }
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)}`;
};

export type AdvancedVisualizerProps = {
  mode?: AdvancedMode;
  onModeChange?: (m: AdvancedMode) => void;
  className?: string;
  suspended?: boolean;
  /** O/S/R/Q chip column. Hide when a parent (e.g. VisualizerHost) already picks mode. */
  showModeButtons?: boolean;
};

export const AdvancedVisualizer: React.FC<AdvancedVisualizerProps> = ({
  mode: modeProp,
  onModeChange,
  className,
  suspended,
  showModeButtons = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [modeState, setModeState] = useState<AdvancedMode>('spectrum');
  const mode = modeProp ?? modeState;
  const setMode = (m: AdvancedMode) => {
    setModeState(m);
    onModeChange?.(m);
  };
  const [peakDb, setPeakDb] = useState(-Infinity);
  const [rmsDb, setRmsDb] = useState(-Infinity);
  const [ctxInfo, setCtxInfo] = useState<{ sr: number; fft: number }>({
    sr: 44100,
    fft: 2048,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track whether THIS instance's wrapper is the fullscreen element. The
  // component mounts in several hosts at once, so the state must compare
  // against the instance's own ref rather than a global boolean.
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Resize the canvas to its container, accounting for device pixel ratio and
  // the shell's CSS zoom. No inline style is written: `inset-0 w-full h-full`
  // already stretches the canvas, and a rect-derived width would land in the
  // zoomed subtree a second time and shrink the scope inside its own frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapperRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const resize = () => {
      fitCanvas(canvas, wrap, { maxDpr: 2 });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Render loop — reads from the shared engine analyser.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) {
      return;
    }
    const analyser = getAnalyser();
    const engineCtx = getEngineCtx();
    setCtxInfo({ sr: engineCtx.sampleRate, fft: analyser.fftSize });

    const timeBuf = new Uint8Array(analyser.fftSize);
    const freqBuf = new Uint8Array(analyser.frequencyBinCount);
    let hudCounter = 0;

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (suspended) {
        return;
      }
      const w = canvas.width;
      const h = canvas.height;

      ctx2d.clearRect(0, 0, w, h);

      if (mode === 'oscilloscope') {
        analyser.getByteTimeDomainData(timeBuf);
        ctx2d.lineWidth = 1.5;
        ctx2d.strokeStyle = '#8b5cf6';
        ctx2d.shadowBlur = 8;
        ctx2d.shadowColor = '#8b5cf6';
        ctx2d.beginPath();
        const step = w / timeBuf.length;
        for (let i = 0; i < timeBuf.length; i += 1) {
          const v = (timeBuf[i] - 128) / 128;
          const x = i * step;
          const y = h / 2 + v * (h / 2 - 4);
          if (i === 0) {
            ctx2d.moveTo(x, y);
          } else {
            ctx2d.lineTo(x, y);
          }
        }
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;
      } else if (mode === 'spectrum') {
        analyser.getByteFrequencyData(freqBuf);
        const usableBins = Math.min(
          freqBuf.length,
          Math.floor(freqBuf.length * 0.6),
        );
        const barCount = Math.min(96, usableBins);
        const barWidth = w / barCount;
        const floor = h - OVERLAY_RESERVE_HEIGHT;
        for (let i = 0; i < barCount; i += 1) {
          const t = i / barCount;
          const binIdx = Math.floor(Math.pow(t, 1.6) * (usableBins - 1));
          const mag = freqBuf[binIdx] / 255;
          const barH = Math.max(1, mag * (floor - 4));
          const x = i * barWidth;
          const grad = ctx2d.createLinearGradient(0, floor, 0, floor - barH);
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(1, '#c4b5fd');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(
            x + 0.5,
            floor - barH,
            Math.max(1, barWidth - 1),
            barH,
          );
        }
      } else if (mode === 'radial') {
        analyser.getByteFrequencyData(freqBuf);
        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.18;
        const segs = Math.min(180, freqBuf.length);
        ctx2d.strokeStyle = '#a78bfa';
        ctx2d.lineWidth = 1;
        ctx2d.shadowBlur = 6;
        ctx2d.shadowColor = '#8b5cf6';
        ctx2d.beginPath();
        for (let i = 0; i <= segs; i += 1) {
          const t = i / segs;
          const binIdx = Math.floor(Math.pow(t, 1.4) * (freqBuf.length - 1));
          const mag = freqBuf[binIdx] / 255;
          const r = baseR + mag * (Math.min(w, h) * 0.32);
          const ang = (i / segs) * Math.PI * 2;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          if (i === 0) {
            ctx2d.moveTo(x, y);
          } else {
            ctx2d.lineTo(x, y);
          }
        }
        ctx2d.closePath();
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;
      }

      hudCounter += 1;
      if (hudCounter % 5 === 0) {
        const { peakDb: pd, rmsDb: rd } = samplePeakAndRMS(getAnalyser());
        setPeakDb(pd);
        setRmsDb(rd);
      }
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode]);

  const modeLabels: Record<AdvancedMode, string> = {
    oscilloscope: 'O',
    spectrum: 'S',
    radial: 'R',
    quantum: 'Q',
  };
  const modeTitles: Record<AdvancedMode, string> = {
    oscilloscope: 'Oscilloscope',
    spectrum: 'Spectrum',
    radial: 'Radial',
    quantum: 'Quantum Lattice',
  };

  return (
    <div
      className={
        className ??
        'hardware-card group relative flex h-full flex-col overflow-hidden bg-black/40'
      }
    >
      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-7"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Canvas area — fills all space above status bar */}
      <div ref={wrapperRef} className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Quantum Lattice WebGL mode overlays the 2D canvas when selected */}
        {mode === 'quantum' && <QuantumLatticeView />}

        {/* O / S / R / Q mode buttons — vertical column, top-left */}
        {showModeButtons ? (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {(['oscilloscope', 'spectrum', 'radial', 'quantum'] as const).map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  title={modeTitles[m]}
                  aria-label={modeTitles[m]}
                  aria-pressed={mode === m}
                  className={`flex size-5 items-center justify-center rounded text-[8px] font-black transition-colors ${
                    mode === m
                      ? 'bg-purple-600 text-white shadow-[0_0_6px_rgba(139,92,246,0.6)]'
                      : 'border border-white/10 bg-black/50 text-zinc-600 hover:border-white/20 hover:text-zinc-300'
                  }`}
                >
                  {modeLabels[m]}
                </button>
              ),
            )}
          </div>
        ) : null}

        {/* Bottom overlay — gradient backdrop with kHz / RMS / PEAK / LIVE + controls */}
        <div
          className="absolute right-0 bottom-0 left-0 flex h-7 items-center gap-2.5 px-2.5"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            filter: 'drop-shadow(0 -1px 4px rgba(0,0,0,0.6))',
          }}
        >
          <span
            className="font-mono text-[9px] text-zinc-400 uppercase tabular-nums"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {(ctxInfo.sr / 1000).toFixed(1)} kHz · {ctxInfo.fft}
          </span>

          <div className="h-3 w-px bg-white/15" />

          <div className="flex items-center gap-1">
            <Zap
              className="h-3 w-3 shrink-0 text-yellow-400"
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}
            />
            <span
              className="font-mono text-[9px] text-zinc-300 tabular-nums"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              RMS {formatDb(rmsDb)} dB
            </span>
          </div>

          <div className="h-3 w-px bg-white/15" />

          <div className="flex items-center gap-1">
            <Target
              className="h-3 w-3 shrink-0 text-emerald-400"
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}
            />
            <span
              className="font-mono text-[9px] text-zinc-300 tabular-nums"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              PEAK {formatDb(peakDb)} dB
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <span
              className={`font-mono text-[9px] font-black uppercase ${peakDb > -60 ? 'text-purple-300' : 'text-zinc-600'}`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              {peakDb > -60 ? 'LIVE' : 'SILENT'}
            </span>
          </div>

          <div className="h-3 w-px bg-white/15" />

          <div className="flex gap-0.5">
            <button
              type="button"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-pressed={isFullscreen}
              className="rounded p-0.5 text-zinc-500 transition-colors hover:bg-white/15 hover:text-zinc-200"
              onClick={() => {
                if (isFullscreen) {
                  void document.exitFullscreen().catch(() => {});
                } else {
                  void wrapperRef.current?.requestFullscreen().catch(() => {});
                }
              }}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
