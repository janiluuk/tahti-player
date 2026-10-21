import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Box } from '@tahti-player/ui';

/** A titled, colored panel — the shared card treatment for governance
 * sections across the member-facing governance pages (replaces plain
 * `SectionShell` headings with real visual boundaries). */
export function GovernancePanel({
  title,
  icon: Icon,
  variant = 'tertiary',
  children,
}: {
  title: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: ReactNode;
}) {
  return (
    <Box variant={variant} className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {Icon && <Icon size={18} aria-hidden className="shrink-0" />}
        {title}
      </h2>
      {children}
    </Box>
  );
}
