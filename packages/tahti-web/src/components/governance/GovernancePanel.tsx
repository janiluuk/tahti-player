import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Box } from '@tahti-player/ui';

import { cn } from '../../lib/cn';

export type GovernanceAccent =
  'purple' | 'cyan' | 'green' | 'orange' | 'blue' | 'yellow' | 'red';

const ACCENT_EDGE: Record<GovernanceAccent, string> = {
  purple: 'border-t-accent-purple',
  cyan: 'border-t-accent-cyan',
  green: 'border-t-accent-green',
  orange: 'border-t-accent-orange',
  blue: 'border-t-accent-blue',
  yellow: 'border-t-accent-yellow',
  red: 'border-t-accent-red',
};

const ACCENT_CHIP: Record<GovernanceAccent, string> = {
  purple: 'bg-accent-purple/20 text-accent-purple-strong',
  cyan: 'bg-accent-cyan/20 text-accent-cyan-strong',
  green: 'bg-accent-green/20 text-accent-green-strong',
  orange: 'bg-accent-orange/20 text-accent-orange-strong',
  blue: 'bg-accent-blue/20 text-accent-blue-strong',
  yellow: 'bg-accent-yellow/25 text-accent-yellow-strong',
  red: 'bg-accent-red/20 text-accent-red-strong',
};

/** A titled panel for governance sections. `accent` colours its top edge
 * and icon chip so each section is recognisable at a glance. */
export function GovernancePanel({
  title,
  icon: Icon,
  variant = 'tertiary',
  accent,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'tertiary';
  accent?: GovernanceAccent;
  children: ReactNode;
}) {
  return (
    <Box
      variant={variant}
      className={cn(
        'flex flex-col gap-3',
        accent && 'border-t-4',
        accent && ACCENT_EDGE[accent],
      )}
      data-accent={accent}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {Icon ? (
          accent ? (
            <span
              className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-md',
                ACCENT_CHIP[accent],
              )}
            >
              <Icon size={17} aria-hidden />
            </span>
          ) : (
            <Icon size={18} aria-hidden className="shrink-0" />
          )
        ) : null}
        {title}
      </h2>
      {children}
    </Box>
  );
}

export function governanceAccentChip(accent: GovernanceAccent): string {
  return ACCENT_CHIP[accent];
}
