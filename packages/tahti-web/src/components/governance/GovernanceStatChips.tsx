import type { LucideIcon } from 'lucide-react';
import { FileTextIcon, LandmarkIcon, UsersIcon, VoteIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <div className="grid grid-cols-1 gap-3 min-[22.5rem]:grid-cols-2 sm:grid-cols-4">
      <AccentStat
        value={openMotions}
        label={t('governanceStatChipsText.openMotions')}
        icon={VoteIcon}
        accent="red"
      />
      <AccentStat
        value={topics}
        label={t('governanceStatChipsText.topics')}
        icon={LandmarkIcon}
        accent="purple"
      />
      <AccentStat
        value={meetings}
        label={t('governanceStatChipsText.meetings')}
        icon={UsersIcon}
        accent="blue"
      />
      <AccentStat
        value={documents}
        label={t('governanceStatChipsText.documents')}
        icon={FileTextIcon}
        accent="cyan"
      />
    </div>
  );
}
