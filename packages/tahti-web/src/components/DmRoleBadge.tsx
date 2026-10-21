import { Badge } from '@tahti-player/ui';

import type { ChannelStaffRole } from '../api/messages';
import { cn } from '../lib/cn';

const LABELS: Record<
  ChannelStaffRole,
  { text: string; color: 'purple' | 'blue' }
> = {
  owner: { text: 'Artist', color: 'purple' },
  moderator: { text: 'Moderator', color: 'blue' },
};

/** Marks a DM participant who owns or moderates a channel. */
export function DmRoleBadge({
  role,
  className,
}: {
  role: ChannelStaffRole | null | undefined;
  className?: string;
}) {
  const label = role ? LABELS[role] : undefined;
  if (!label) {
    return null;
  }
  return (
    <Badge
      variant="pill"
      color={label.color}
      className={cn('px-1.5 text-[10px] leading-tight', className)}
    >
      {label.text}
    </Badge>
  );
}
