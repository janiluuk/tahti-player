import type { LucideIcon } from 'lucide-react';
import { FileTextIcon, LandmarkIcon, UsersIcon, VoteIcon } from 'lucide-react';

import { StatChip } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { governanceAccentChip, type GovernanceAccent } from './GovernancePanel';

function AccentStat({
  value,
  label,
  icon: Icon,
  accent,
}: {
  value: number;
  label: string;
  icon: LucideIcon;
  accent: GovernanceAccent;
}) {
  return (
    <StatChip
      value={value}
      label={label}
      className="px-3 py-2"
      icon={
        <span
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md',
            governanceAccentChip(accent),
          )}
        >
          <Icon size={16} aria-hidden />
        </span>
      }
    />
  );
}

export function GovernanceStatChips({
  openMotions,
  topics,
  meetings,
  documents,
}: {
  openMotions: number;
  topics: number;
  meetings: number;
  documents: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[22.5rem]:grid-cols-2 sm:grid-cols-4">
      <AccentStat
        value={openMotions}
        label="Open motions"
        icon={VoteIcon}
        accent="red"
      />
      <AccentStat
        value={topics}
        label="Topics"
        icon={LandmarkIcon}
        accent="purple"
      />
      <AccentStat
        value={meetings}
        label="Meetings"
        icon={UsersIcon}
        accent="blue"
      />
      <AccentStat
        value={documents}
        label="Documents"
        icon={FileTextIcon}
        accent="cyan"
      />
    </div>
  );
}
