import { RotateCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button } from '@tahti-player/ui';

import {
  fetchEventShares,
  retryEventShare,
  type EventShare,
} from '../../api/event-calendar';

const PLATFORM_LABEL = { MASTODON: 'Mastodon', BLUESKY: 'Bluesky' } as const;
const STATE_COLOR = {
  PENDING: 'yellow',
  SENT: 'green',
  FAILED: 'red',
} as const;

/** The event's Mastodon / Bluesky announcements, with Retry on a failure.
 * Renders nothing when the event was never shared. */
export function EventSharesPanel({ eventId }: { eventId: string }) {
  const { t } = useTranslation('web');
  const [shares, setShares] = useState<EventShare[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchEventShares(eventId).then((result) => {
      if (!cancelled) {
        setShares(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (shares.length === 0) {
    return null;
  }

  const retry = (share: EventShare) => {
    void retryEventShare(eventId, share.id).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setShares((current) =>
        current.map((row) => (row.id === share.id ? result.data : row)),
      );
    });
  };

  return (
    <ul
      className="flex flex-col gap-2 text-sm"
      aria-label={t('events.shares')}
      data-testid="event-shares"
    >
      {shares.map((share) => (
        <li key={share.id} className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{PLATFORM_LABEL[share.platform]}</span>
          <Badge variant="pill" color={STATE_COLOR[share.state]}>
            {t(`events.share${share.state}`)}
          </Badge>
          {share.state === 'FAILED' && share.error ? (
            <span className="text-foreground-secondary text-xs">
              {share.error}
            </span>
          ) : null}
          {share.state === 'FAILED' ? (
            <Button size="xs" variant="secondary" onClick={() => retry(share)}>
              <RotateCwIcon size={13} aria-hidden className="mr-1" />
              {t('events.retryShare')}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
