import { useEffect, useState } from 'react';

import { Button } from '@tahti-player/ui';

import {
  fetchUsernameAvailability,
  type UsernameAvailability,
} from '../api/username-available';

const CHECK_DELAY_MS = 400;
const VALID_USERNAME = /^[a-z0-9_-]{2,32}$/;

/** Live "is this handle free?" line under the join form's name field. */
export function UsernameAvailabilityHint({
  username,
  onPick,
}: {
  username: string;
  onPick: (username: string) => void;
}) {
  const [result, setResult] = useState<{
    username: string;
    availability: UsernameAvailability | null;
  } | null>(null);

  useEffect(() => {
    if (!VALID_USERNAME.test(username)) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchUsernameAvailability(username).then((availability) => {
        if (!cancelled) {
          setResult({ username, availability });
        }
      });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username]);

  if (!username) {
    return null;
  }
  if (!VALID_USERNAME.test(username)) {
    return (
      <p className="text-foreground-secondary text-xs">
        Your handle needs 2–32 letters, numbers, - or _.
      </p>
    );
  }
  const availability =
    result?.username === username ? result.availability : undefined;

  return (
    <div className="text-xs" aria-live="polite" data-testid="username-hint">
      {availability === undefined || availability === null ? (
        <p className="text-foreground-secondary">
          Your handle: <span className="font-semibold">{username}</span>
        </p>
      ) : availability.available ? (
        <p className="text-accent-green-strong">
          <span className="font-semibold">{username}</span> is free.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-accent-red-strong">
            <span className="font-semibold">{username}</span> is taken.
          </span>
          {(availability.suggestions ?? []).length > 0 ? (
            <>
              <span className="text-foreground-secondary">Try</span>
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
