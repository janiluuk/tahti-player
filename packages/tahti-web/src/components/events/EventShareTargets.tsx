import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Checkbox } from '@tahti-player/ui';

import type { EventShareTarget } from '../../api/event-calendar';
import { fetchSocialAutoPost } from '../../api/social-autopost';

type Connected = { id: EventShareTarget; label: string };

/** Pick which connected Mastodon / Bluesky accounts announce the event when
 * it is published. */
export function EventShareTargets({
  value,
  onChange,
}: {
  value: EventShareTarget[];
  onChange: (value: EventShareTarget[]) => void;
}) {
  const { t } = useTranslation('web');
  const [connected, setConnected] = useState<Connected[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchSocialAutoPost().then((result) => {
      if (cancelled) {
        return;
      }
      const rows: Connected[] = [];
      if (result.data?.mastodon.connected) {
        rows.push({
          id: 'MASTODON',
          label: `Mastodon${result.data.mastodon.accountLabel ? ` (${result.data.mastodon.accountLabel})` : ''}`,
        });
      }
      if (result.data?.bluesky.connected) {
        rows.push({
          id: 'BLUESKY',
          label: `Bluesky${result.data.bluesky.accountLabel ? ` (${result.data.bluesky.accountLabel})` : ''}`,
        });
      }
      setConnected(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (connected === null) {
    return null;
  }

  return (
    <fieldset className="flex flex-col gap-2" data-testid="event-share-targets">
      <legend className="mb-1 text-sm font-semibold">
        {t('events.shareOnPublish')}
      </legend>
      {connected.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          {t('events.shareConnectHint')}{' '}
          <Link
            to="/settings/$section"
            params={{ section: 'artist' }}
            className="text-primary-strong hover:underline"
          >
            {t('events.shareConnectLink')}
          </Link>
        </p>
      ) : (
        connected.map((row) => (
          <Checkbox
            key={row.id}
            label={row.label}
            checked={value.includes(row.id)}
            onChange={(checked) =>
              onChange(
                checked
                  ? [...value, row.id]
                  : value.filter((target) => target !== row.id),
              )
            }
          />
        ))
      )}
    </fieldset>
  );
}
