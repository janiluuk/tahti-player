import { Link } from '@tanstack/react-router';
import { CalendarCheckIcon } from 'lucide-react';

import type { GovernanceMotionDetail } from '../../api/types';

export function MotionMeetingNote({
  meeting,
  agendaItem,
}: {
  meeting: GovernanceMotionDetail['meeting'];
  agendaItem?: GovernanceMotionDetail['agendaItem'];
}) {
  if (!meeting) {
    return null;
  }
  return (
    <p className="text-foreground-secondary flex items-start gap-1.5 text-sm">
      <CalendarCheckIcon size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span>
        Taken up at{' '}
        <Link
          to="/governance/meetings/$id"
          params={{ id: meeting.id }}
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          {meeting.title}
        </Link>
        {meeting.scheduledAt
          ? `, ${new Date(meeting.scheduledAt).toLocaleDateString()}`
          : ''}
        {agendaItem
          ? `, agenda item ${agendaItem.position}: ${agendaItem.title}`
          : ''}
      </span>
    </p>
  );
}
