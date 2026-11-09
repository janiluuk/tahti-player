import { CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  answerEventInvite,
  fetchEventInvites,
  type EventInvite,
} from '../../api/event-calendar';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { PageEmpty, PageLoading } from '../PageStates';
import { EventCard } from './EventCard';

/** Events other artists tagged you on, with accept / decline. */
export function EventInvitesPanel() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<EventInvite[]>('event-invites', async () =>
    apiResult(await fetchEventInvites()),
  );
  const invites = snapshot.data ?? [];

  if (snapshot.loading && !snapshot.data) {
    return <PageLoading label={t('events.loading')} />;
  }
  if (invites.length === 0) {
    return <PageEmpty title={t('events.noInvites')} />;
  }

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

  return (
    <ul className="flex flex-col gap-2" data-testid="event-invites">
      {invites.map((invite) => (
        <li key={invite.event.id} className="flex flex-col gap-1">
          <p className="text-foreground-secondary text-xs">
            {t('events.invitedBy', {
              name: invite.host.displayName,
              role: t(`events.role${invite.role}`),
            })}
          </p>
          <EventCard
            event={invite.event}
            linkToPage
            actions={
              invite.status === 'PENDING' ? (
                <>
                  <Button size="xs" onClick={() => answer(invite, 'accept')}>
                    <CheckIcon size={14} aria-hidden className="mr-1" />
                    {t('events.accept')}
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => answer(invite, 'decline')}
                  >
                    <XIcon size={14} aria-hidden className="mr-1" />
                    {t('events.decline')}
                  </Button>
                </>
              ) : (
                <span className="text-foreground-secondary text-xs">
                  {t(`events.tag${invite.status}`)}
                </span>
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}
