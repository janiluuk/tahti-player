import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

/** Large display-face accent number — payout figures, "0%"-style stats. */
export function StatNumber({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-heading text-primary text-4xl font-bold tabular-nums',
        className,
      )}
    >
      {children}
    </span>
  );
}
