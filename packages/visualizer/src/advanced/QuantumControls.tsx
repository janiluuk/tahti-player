/**
 * QuantumControls — the full parameter surface for the Quantum Lattice visual
 * (Visualize tab). A compact, grouped drawer: shape buttons, palette, master
 * audio drive, and every QUANTUM_PARAMS slider with a per-param audio-band
 * selector (none/bass/mid/high/volume), mirroring the VJ shader control deck.
 * Values + bands are lifted to QuantumLatticeView, which feeds them to the
 * engine via resolveQuantumParams.
 */
import { Box, Donut, Grid3x3, RotateCcw, Star, X } from 'lucide-react';
import React from 'react';

import {
  QUANTUM_GEOMETRY_NAMES,
  QUANTUM_GROUPS,
  QUANTUM_PALETTES,
  QUANTUM_PARAMS,
  type QuantumAudioBand,
} from '../quantumLattice';

const SHAPE_ICONS = [Donut, Box, Star, Grid3x3];

interface Props {
  shape: number;
  onShape: (n: number) => void;
  paletteIdx: number; // -1 = auto (follows shape)
  onPalette: (n: number) => void;
  audioDrive: number;
  onDrive: (n: number) => void;
  values: Record<string, number>;
  onValue: (id: string, v: number) => void;
  audio: Record<string, QuantumAudioBand>;
  onAudio: (id: string, b: QuantumAudioBand) => void;
  onReset: () => void;
  onClose: () => void;
}

const BANDS: { v: QuantumAudioBand; t: string }[] = [
  { v: 'none', t: '—' },
  { v: 'bass', t: 'BAS' },
  { v: 'mid', t: 'MID' },
  { v: 'high', t: 'HI' },
  { v: 'volume', t: 'VOL' },
];

export const QuantumControls: React.FC<Props> = ({
  shape,
  onShape,
  paletteIdx,
  onPalette,
  audioDrive,
  onDrive,
  values,
  onValue,
  audio,
  onAudio,
  onReset,
  onClose,
}) => {
  return (
    <div className="absolute top-7 right-1 bottom-8 z-20 flex w-48 flex-col overflow-hidden rounded-md border border-cyan-500/25 bg-black/85 text-zinc-200 backdrop-blur-sm">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-1">
        <span className="font-mono text-[8px] tracking-[0.25em] text-cyan-300/80 uppercase">
          Quantum
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Reset all to defaults"
            aria-label="Reset Quantum parameters"
            className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close controls"
            aria-label="Close Quantum controls"
            className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-1.5">
        {/* shape */}
        <div>
          <span className="mb-1 block font-mono text-[7px] tracking-widest text-zinc-500 uppercase">
            Geometry
          </span>
          <div className="grid grid-cols-4 gap-1">
            {QUANTUM_GEOMETRY_NAMES.map((name, i) => {
              const Icon = SHAPE_ICONS[i];
              const on = shape === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onShape(i)}
                  title={name}
                  aria-label={`Morph to ${name}`}
                  aria-pressed={on}
                  className={`grid h-6 place-items-center rounded border transition-colors ${
                    on
                      ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/25 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        </div>

        {/* palette + master drive */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="q-palette"
              className="w-16 shrink-0 font-mono text-[8px] tracking-wide text-zinc-400 uppercase"
            >
              Palette
            </label>
            <select
              id="q-palette"
              name="q-palette"
              value={paletteIdx}
              onChange={(e) => onPalette(parseInt(e.target.value, 10))}
              className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-1 py-0.5 font-mono text-[8px] text-zinc-100"
            >
              <option value={-1}>Auto</option>
              {QUANTUM_PALETTES.map((p, i) => (
                <option key={p} value={i}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <label
              htmlFor="q-drive"
              className="w-16 shrink-0 font-mono text-[8px] tracking-wide text-zinc-400 uppercase"
              title="Master audio reactivity"
            >
              Audio Drive
            </label>
            <input
              id="q-drive"
              name="q-drive"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={audioDrive}
              onChange={(e) => onDrive(parseFloat(e.target.value))}
              className="min-w-0 flex-1 accent-cyan-500"
            />
            <span className="w-7 shrink-0 text-right font-mono text-[8px] text-zinc-500 tabular-nums">
              {audioDrive.toFixed(2)}
            </span>
          </div>
        </div>

        {/* param groups */}
        {QUANTUM_GROUPS.map((group, gi) => (
          <details
            key={group}
            open={gi < 2}
            className="rounded border border-white/8 bg-white/3"
          >
            <summary className="cursor-pointer px-1.5 py-1 font-mono text-[7px] tracking-widest text-zinc-400 uppercase select-none hover:text-zinc-200">
              {group}
            </summary>
            <div className="space-y-1 px-1.5 pb-1.5">
              {QUANTUM_PARAMS.filter((p) => p.group === group).map((p) => {
                const val = values[p.id] ?? p.default;
                const band = audio[p.id] ?? p.audio ?? 'none';
                return (
                  <div key={p.id} className="flex items-center gap-1">
                    <label
                      htmlFor={`q-${p.id}`}
                      className="w-14 shrink-0 truncate font-mono text-[8px] tracking-wide text-zinc-400 uppercase"
                      title={p.label}
                    >
                      {p.label}
                    </label>
                    <input
                      id={`q-${p.id}`}
                      name={`q-${p.id}`}
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={val}
                      onChange={(e) =>
                        onValue(p.id, parseFloat(e.target.value))
                      }
                      className="min-w-0 flex-1 accent-cyan-500"
                    />
                    <label htmlFor={`q-${p.id}-aud`} className="sr-only">
                      {p.label} audio band
                    </label>
                    <select
                      id={`q-${p.id}-aud`}
                      name={`q-${p.id}-aud`}
                      value={band}
                      onChange={(e) =>
                        onAudio(p.id, e.target.value as QuantumAudioBand)
                      }
                      title={`${p.label}: audio band that drives it`}
                      className="w-10 shrink-0 rounded border border-zinc-600 bg-zinc-800 px-0.5 py-0.5 font-mono text-[7px] text-zinc-100"
                    >
                      {BANDS.map((b) => (
                        <option key={b.v} value={b.v}>
                          {b.t}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};
