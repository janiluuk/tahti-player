import { useEffect, useState } from 'react';

import { Button, Select } from '@tahti-player/ui';

import { fetchGovernanceMeetings } from '../../api/client';
import { linkMotionMeeting } from '../../api/governance-motion-meeting';
import type {
  GovernanceMeeting,
  GovernanceMotionDetail,
} from '../../api/types';

const NO_MEETING = '';

/** Board only: choose the meeting that takes the motion up. */
export function MotionMeetingLinkControl({
  motion,
  onChanged,
}: {
  motion: GovernanceMotionDetail;
  onChanged: () => void;
}) {
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
        label="Meeting"
        value={meetingId}
        onValueChange={setMeetingId}
        options={[
          { id: NO_MEETING, label: 'No meeting' },
          ...meetings.map((meeting) => ({
            id: meeting.id,
            label: meeting.scheduledAt
              ? `${meeting.title} (${new Date(meeting.scheduledAt).toLocaleDateString()})`
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
        Save meeting
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>
      {error ? (
        <p role="alert" className="text-accent-red-strong w-full text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
