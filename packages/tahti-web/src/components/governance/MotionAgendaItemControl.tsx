import { useEffect, useState } from 'react';

import { Button, Select } from '@tahti-player/ui';

import {
  fetchMeetingAgenda,
  type MemberAgendaItem,
} from '../../api/governance-meeting-agenda';
import { linkMotionAgendaItem } from '../../api/governance-motion-meeting';
import type { GovernanceMotionDetail } from '../../api/types';

const NO_ITEM = '';

/** Board only: name the item on the linked meeting's agenda that takes the
 * motion up. */
export function MotionAgendaItemControl({
  motion,
  onChanged,
}: {
  motion: GovernanceMotionDetail;
  onChanged: () => void;
}) {
  const meetingId = motion.meeting?.id;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MemberAgendaItem[] | null>(null);
  const [itemId, setItemId] = useState(motion.agendaItem?.id ?? NO_ITEM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && meetingId) {
      void fetchMeetingAgenda(meetingId).then((result) =>
        setItems(result.data),
      );
    }
  }, [open, meetingId]);

  if (!meetingId) {
    return null;
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        {motion.agendaItem ? 'Change agenda item' : 'Choose agenda item'}
      </Button>
    );
  }

  if (items !== null && items.length === 0) {
    return (
      <p className="text-foreground-secondary text-xs">
        That meeting has no agenda items yet. Add them under Admin → Governance
        → AGM.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label="Agenda item"
        value={itemId}
        onValueChange={setItemId}
        options={[
          { id: NO_ITEM, label: 'No agenda item' },
          ...(items ?? []).map((item) => ({
            id: item.id,
            label: `${item.position}. ${item.title}`,
          })),
        ]}
      />
      <Button
        size="sm"
        disabled={busy || items === null}
        onClick={() => {
          setBusy(true);
          setError(null);
          void linkMotionAgendaItem(motion.id, itemId || null).then(
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
        Save agenda item
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
