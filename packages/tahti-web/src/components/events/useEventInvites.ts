import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  answerEventInvite,
  fetchEventInvites,
  type EventInvite,
} from '../../api/event-calendar';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';

export function useEventInvites() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<EventInvite[]>('event-invites', async () =>
    apiResult(await fetchEventInvites()),
  );

  const answer = (invite: EventInvite, choice: 'accept' | 'decline') => {
    void answerEventInvite(invite.event.id, choice).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        choice === 'accept'
          ? t('events.inviteAccepted')
          : t('events.inviteDeclined'),
      );
      const status = choice === 'accept' ? 'ACCEPTED' : 'DECLINED';
      snapshot.mutate((current) =>
        (current ?? []).map((row) =>
          row.event.id === invite.event.id ? { ...row, status } : row,
        ),
      );
    });
  };

  return {
    invites: snapshot.data ?? [],
    loading: snapshot.loading && !snapshot.data,
    answer,
  };
}
