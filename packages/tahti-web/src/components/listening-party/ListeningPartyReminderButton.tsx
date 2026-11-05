import { BellIcon, BellRingIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import type { ListeningPartyState } from '../../api/listening-parties';
import {
  fetchPartyReminder,
  setPartyReminder,
  type PartyReminder,
} from '../../api/listening-party-reminders';
import { useAuthStore } from '../../stores/authStore';

/** Before a party starts: ask to be told when it begins (and if it moves or
 * is cancelled). Signed-out visitors only see how many people are waiting. */
export function ListeningPartyReminderButton({
  partyId,
  state,
}: {
  partyId: string;
  state: ListeningPartyState;
}) {
  const { t } = useTranslation('web');
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const [reminder, setReminder] = useState<PartyReminder | null>(null);
  const [busy, setBusy] = useState(false);
  const scheduled = state === 'SCHEDULED';

  useEffect(() => {
    if (!scheduled) {
      return;
    }
    let active = true;
    void fetchPartyReminder(partyId).then((result) => {
      if (active) {
        setReminder(result.data);
      }
    });
    return () => {
      active = false;
    };
  }, [partyId, scheduled, signedIn]);

  if (!scheduled || !reminder) {
    return null;
  }

  const toggle = async () => {
    setBusy(true);
    const result = await setPartyReminder(partyId, !reminder.reminded);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setReminder(result.data);
    toast.success(
      t(
        result.data.reminded
          ? 'listeningParty.reminderSet'
          : 'listeningParty.reminderOff',
      ),
    );
  };

  const count =
    reminder.count > 0 ? (
      <span className="text-foreground-secondary text-sm">
        {t('listeningParty.reminderCount', { count: reminder.count })}
      </span>
    ) : null;

  if (!signedIn) {
    return count;
  }
  return (
    <>
      <Button
        size="sm"
        variant={reminder.reminded ? 'secondary' : 'default'}
        aria-pressed={reminder.reminded}
        disabled={busy}
        onClick={() => void toggle()}
      >
        {reminder.reminded ? (
          <BellRingIcon size={14} aria-hidden className="mr-1.5" />
        ) : (
          <BellIcon size={14} aria-hidden className="mr-1.5" />
        )}
        {t(
          reminder.reminded
            ? 'listeningParty.reminderOn'
            : 'listeningParty.remindMe',
        )}
      </Button>
      {count}
    </>
  );
}
