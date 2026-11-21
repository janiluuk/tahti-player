import { Link } from '@tanstack/react-router';
import { CalendarCheckIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';

import type { GovernanceMotionDetail } from '../../api/types';
import { ListingDate } from '../ListingDate';

export function MotionMeetingNote({
  meeting,
  agendaItem,
}: {
  meeting: GovernanceMotionDetail['meeting'];
  agendaItem?: GovernanceMotionDetail['agendaItem'];
}) {
  const { t } = useTranslation('web');
  if (!meeting) {
    return null;
  }
  return (
    <p className="text-foreground-secondary flex items-start gap-1.5 text-sm">
      <CalendarCheckIcon size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span>
        {t('motionMeetingNoteBatch35.takenUpAt')}{' '}
        <Link
          to="/governance/meetings/$id"
          params={{ id: meeting.id }}
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          {meeting.title}
        </Link>
        {meeting.scheduledAt ? (
          <>
            {', '}
            <ListingDate value={meeting.scheduledAt} />
          </>
        ) : null}
        {agendaItem
          ? `, ${t('motionMeetingNoteBatch35.agendaItem', {
              position: agendaItem.position,
              title: agendaItem.title,
            })}`
          : ''}
      </span>
    </p>
  );
}
