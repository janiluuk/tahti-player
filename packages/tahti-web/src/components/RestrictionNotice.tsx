import { BanIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert } from '@tahti-player/ui';

import {
  fetchMyRestrictions,
  type MyRestriction,
  type RestrictionType,
} from '../api/me-restrictions';

const BLOCKED: Record<RestrictionType, string> = {
  UPLOAD: 'Uploads are blocked',
  LIVE_SHOW_BOOKING: 'Booking shows is blocked',
  LOGIN: 'Sign-in is blocked',
};

function untilLabel(expiresAt: string | null): string {
  if (!expiresAt) {
    return '';
  }
  return ` until ${new Date(expiresAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

/** Says up front that the board has blocked this kind of action on the
 * account, with its reason, instead of leaving the artist to find out from
 * a refused upload or booking. Renders nothing when there is no ban. */
export function RestrictionNotice({ type }: { type: RestrictionType }) {
  const [restriction, setRestriction] = useState<MyRestriction | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMyRestrictions().then((rows) => {
      if (!cancelled) {
        setRestriction(rows.find((row) => row.type === type) ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [type]);

  if (!restriction) {
    return null;
  }
  return (
    <Alert
      tone="warning"
      icon={<BanIcon aria-hidden className="size-4" />}
      title={`${BLOCKED[type]}${untilLabel(restriction.expiresAt)}`}
    >
      <p>Reason: {restriction.reason}</p>
      <p className="mt-1">
        Ask the board through Help → Support if you think this is a mistake.
      </p>
    </Alert>
  );
}
