import { CheckIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Tooltip } from '@tahti-player/ui';

/** Check-mark pill beside an artist's name when they are a Tahti ry member;
 * the tooltip and accessible name spell it out. */
export function TahtiMemberBadge({ isMember }: { isMember?: boolean | null }) {
  const { t } = useTranslation('web');
  if (isMember !== true) {
    return null;
  }
  const label = t('artistProfile.tahtiMember');
  return (
    <Tooltip content={label} side="top" wrapperClassName="inline-flex">
      <Badge
        variant="pill"
        color="secondary"
        tabIndex={0}
        aria-label={label}
        data-testid="tahti-member-badge"
      >
        <CheckIcon size={12} strokeWidth={3} aria-hidden />
      </Badge>
    </Tooltip>
  );
}
