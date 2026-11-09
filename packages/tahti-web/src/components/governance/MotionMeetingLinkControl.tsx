import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Select } from '@tahti-player/ui';

import { fetchGovernanceMeetings } from '../../api/client';
import { linkMotionMeeting } from '../../api/governance-motion-meeting';
import type {
  GovernanceMeeting,
  GovernanceMotionDetail,
} from '../../api/types';
import { numericDay } from '../../lib/relativeDate';

const NO_MEETING = '';

/** Board only: choose the meeting that takes the motion up. */
export function MotionMeetingLinkControl({
  motion,
  onChanged,
}: {
  motion: GovernanceMotionDetail;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [meetingId, setMeetingId] = useState(motion.meeting?.id ?? NO_MEETING);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void fetchGovernanceMeetings().then((result) => setMeetings(result.data));
    }
  }, [open]);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        {motion.meeting ? 'Change meeting' : 'Put on a meeting'}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label={t('motionMeetingLinkControl.meeting')}
        value={meetingId}
        onValueChange={setMeetingId}
        options={[
          {
            id: NO_MEETING,
            label: t('motionMeetingLinkControlFields.noMeeting'),
          },
          ...meetings.map((meeting) => ({
            id: meeting.id,
            label: meeting.scheduledAt
              ? `${meeting.title} (${numericDay(meeting.scheduledAt)})`
              : meeting.title,
          })),
        ]}
      />
      <Button
        size="sm"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void linkMotionMeeting(motion.id, meetingId || null).then(
            (result) => {
              setBusy(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setOpen(false);
              onChanged();
            },
          );
        }}
      >
        {t('motionMeetingLinkControl.saveMeeting')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => setOpen(false)}
      >
        {t('motionMeetingLinkControl.cancel')}
      </Button>
      {error ? (
        <InlineError textSize="xs" className="w-full">
          {error}
        </InlineError>
      ) : null}
    </div>
  );
}
