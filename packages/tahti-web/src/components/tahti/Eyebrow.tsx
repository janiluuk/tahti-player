import type { ReactNode } from 'react';

const TONE_CLASS = {
  primary: 'text-primary',
  green: 'text-accent-green-strong',
  blue: 'text-accent-blue-strong',
  red: 'text-accent-red-strong',
} as const;

/** Mono, uppercase, wide-tracked label — section labels and technical
 * fields (RTMP keys, timestamps), never body copy. Token-driven: font-mono
 * / colour resolve from the active theme. Defaults to the brand accent;
 * pass `tone` to signal a specific state (green = live/playing now, red =
 * on air, blue = informational) instead of defaulting everything to it. */
export function Eyebrow({
  children,
  className,
  tone = 'primary',
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <span
      className={`${TONE_CLASS[tone]} font-mono text-[11px] font-semibold tracking-[0.2em] uppercase ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
