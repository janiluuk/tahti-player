import { useId } from 'react';

import type { VisualizerMode } from '@tahti-player/visualizer';

import styles from './VisualizerModePreview.module.css';

export function VisualizerModePreview({ mode }: { mode: VisualizerMode }) {
  const gradient = useId();
  const landscape = mode.startsWith('landscape-');
  return (
    <svg
      viewBox="0 0 160 90"
      aria-hidden="true"
      focusable="false"
      data-testid="visualizer-mode-preview"
      data-mode={mode}
      className={`block aspect-video w-full overflow-hidden rounded-md ${styles.preview}`}
    >
      <defs>
        <radialGradient id={gradient} cx="35%" cy="30%">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.3" stopColor="#a78bfa" />
          <stop offset="0.65" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0b1220" />
        </radialGradient>
      </defs>
      <path fill="#0b1220" d="M0 0h160v90H0z" />
      {mode === 'spectrum' &&
        Array.from({ length: 18 }, (_, i) => (
          <rect
            key={i}
            x={10 + i * 8}
            y={20 + (i % 5) * 7}
            width="5"
            height={60 - (i % 5) * 7}
            rx="2"
            fill={i % 3 ? '#22d3ee' : '#a78bfa'}
            className={styles.bar}
            style={{ animationDelay: `${-i * 0.17}s` }}
          />
        ))}
      {mode === 'oscilloscope' && (
        <g className={styles.wave} fill="none" stroke="#22d3ee" strokeWidth="2">
          <path d="M-40 45 Q-30 5 -20 45 T0 45 T20 45 T40 45 T60 45 T80 45 T100 45 T120 45 T140 45 T160 45 T180 45 T200 45" />
          <path
            opacity=".35"
            d="M-40 45 Q-20 15 0 45 T40 45 T80 45 T120 45 T160 45 T200 45"
          />
        </g>
      )}
      {mode === 'radial' && (
        <g className={styles.rotate} stroke="#22d3ee" strokeWidth="2">
          {Array.from({ length: 24 }, (_, i) => (
            <path
              key={i}
              d={`M80 24V${6 + (i % 4) * 3}`}
              transform={`rotate(${i * 15} 80 45)`}
            />
          ))}
          <circle cx="80" cy="45" r="16" fill="none" stroke="#a78bfa" />
        </g>
      )}
      {mode === 'quantum' && (
        <g
          className={styles.pulse}
          fill="#a78bfa"
          stroke="#22d3ee"
          strokeWidth=".6"
        >
          {Array.from({ length: 25 }, (_, i) => {
            const x = 36 + (i % 5) * 22;
            const y = 13 + Math.floor(i / 5) * 16;
            return (
              <g key={i}>
                <path d={`M80 45L${x} ${y}`} opacity=".5" />
                <circle cx={x} cy={y} r={2 + (i % 3)} />
              </g>
            );
          })}
        </g>
      )}
      {mode === 'orb' && (
        <g className={styles.pulse}>
          <circle cx="80" cy="45" r="33" fill={`url(#${gradient})`} />
          <ellipse
            cx="80"
            cy="45"
            rx="39"
            ry="12"
            fill="none"
            stroke="#a78bfa"
            transform="rotate(-25 80 45)"
          />
        </g>
      )}
      {mode === 'cymatics' && (
        <g className={styles.rotate} fill="none" stroke="#a78bfa">
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="80"
              cy="45"
              rx="34"
              ry="12"
              transform={`rotate(${i * 22.5} 80 45)`}
            />
          ))}
          <circle cx="80" cy="45" r="8" stroke="#22d3ee" />
        </g>
      )}
      {landscape && (
        <g
          className={styles.terrain}
          fill="none"
          stroke={mode === 'landscape-chrome' ? '#cbd5e1' : '#a78bfa'}
          strokeWidth="1.5"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              opacity={0.35 + i * 0.08}
              d={
                mode === 'landscape-chrome'
                  ? `M-20 ${30 + i * 7} Q20 ${-10 + i * 7} 60 ${30 + i * 7} T140 ${30 + i * 7} T220 ${30 + i * 7}`
                  : `M-20 ${35 + i * 7} Q0 ${35 + i * 7} 12 ${10 + i * 5} Q24 ${60 + i * 4} 40 ${35 + i * 7} Q60 ${-25 + i * 7} 80 ${35 + i * 7} Q100 ${60 + i * 4} 115 ${15 + i * 5} Q130 ${35 + i * 7} 180 ${35 + i * 7}`
              }
            />
          ))}
        </g>
      )}
    </svg>
  );
}
