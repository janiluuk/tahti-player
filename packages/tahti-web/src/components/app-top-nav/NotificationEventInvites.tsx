import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { useEventInvites } from '../events/useEventInvites';

/** Pending event tags, answered from the notifications popover. */
export function NotificationEventInvites() {
  const { t } = useTranslation('web');
  const { invites, answer } = useEventInvites();
  const pending = invites.filter((invite) => invite.status === 'PENDING');

  if (pending.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t('notificationsPopover.eventInvites')}
      data-testid="notification-event-invites"
      className="border-border mb-1 flex flex-col gap-1 border-b pb-2"
    >
      <span className="text-foreground-secondary px-2 text-xs font-semibold">
        {t('notificationsPopover.eventInvites')}
      </span>
      <ul className="flex flex-col gap-1">
        {pending.map((invite) => (
          <li
            key={invite.event.id}
            className="bg-accent-cyan/10 flex flex-col gap-1 rounded-md px-2 py-2 text-xs"
          >
            <span className="font-semibold">{invite.event.title}</span>
            <span className="text-foreground-secondary">
              {t('events.invitedBy', {
                name: invite.host.displayName,
                role: t(`events.role${invite.role}`),
              })}
            </span>
            <div className="flex gap-1">
              <Button
                size="xs"
                aria-label={t('notificationsPopover.acceptInvite', {
                  title: invite.event.title,
                })}
                onClick={() => answer(invite, 'accept')}
              >
                {t('events.accept')}
              </Button>
              <Button
                size="xs"
                variant="secondary"
                aria-label={t('notificationsPopover.declineInvite', {
                  title: invite.event.title,
                })}
                onClick={() => answer(invite, 'decline')}
              >
                {t('events.decline')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
