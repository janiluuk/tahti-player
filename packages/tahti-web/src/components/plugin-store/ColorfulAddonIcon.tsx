import type { ReactNode } from 'react';

const TONES = {
  blue: 'bg-accent-blue-strong text-background',
  green: 'bg-accent-green-strong text-background',
  purple: 'bg-accent-purple-strong text-background',
  yellow: 'bg-accent-yellow-strong text-background',
  cyan: 'bg-accent-cyan-strong text-background',
  orange: 'bg-accent-orange-strong text-background',
  red: 'bg-accent-red-strong text-background',
} as const;

export type AddonIconTone = keyof typeof TONES;

export function ColorfulAddonIcon({
  children,
  tone,
}: {
  children: ReactNode;
  tone: AddonIconTone;
}) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center ${TONES[tone]}`}
      aria-hidden
    >
      {children}
    </span>
  );
}
