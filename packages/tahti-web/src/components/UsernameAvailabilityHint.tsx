import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  fetchUsernameAvailability,
  type UsernameAvailability,
} from '../api/username-available';
import { SLOT, withSlot } from '../lib/slotText';

const CHECK_DELAY_MS = 400;
const VALID_USERNAME = /^[a-z0-9_-]{2,32}$/;

/** Live "is this handle free?" line under the join form's name field. */
export function UsernameAvailabilityHint({
  username,
  onPick,
  onAvailability,
}: {
  username: string;
  onPick: (username: string) => void;
  onAvailability?: (available: boolean | null) => void;
}) {
  const { t } = useTranslation('web');
  const [result, setResult] = useState<{
    username: string;
    availability: UsernameAvailability | null;
  } | null>(null);

  useEffect(() => {
    if (!VALID_USERNAME.test(username)) {
      onAvailability?.(null);
      return;
    }
    onAvailability?.(null);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchUsernameAvailability(username).then((availability) => {
        if (!cancelled) {
          setResult({ username, availability });
          onAvailability?.(
            availability == null ? null : availability.available,
          );
        }
      });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, onAvailability]);

  if (!username) {
    return null;
  }
  if (!VALID_USERNAME.test(username)) {
    return (
      <p className="text-foreground-secondary text-xs">
        {t('usernameAvailabilityHint.invalid')}
      </p>
    );
  }
  const availability =
    result?.username === username ? result.availability : undefined;

  const name = <span className="font-semibold">{username}</span>;

  return (
    <div className="text-xs" aria-live="polite" data-testid="username-hint">
      {availability === undefined || availability === null ? (
        <p className="text-foreground-secondary">
          {withSlot(
            t('usernameAvailabilityHint.yourHandle', { username: SLOT }),
            name,
          )}
        </p>
      ) : availability.available ? (
        <p className="text-accent-green-strong">
          {withSlot(
            t('usernameAvailabilityHint.free', { username: SLOT }),
            name,
          )}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-accent-red-strong">
            {withSlot(
              t('usernameAvailabilityHint.taken', { username: SLOT }),
              name,
            )}
          </span>
          {(availability.suggestions ?? []).length > 0 ? (
            <>
              <span className="text-foreground-secondary">
                {t('usernameAvailabilityHint.try')}
              </span>
              {availability.suggestions!.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="text"
                  size="sm"
                  onClick={() => onPick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
