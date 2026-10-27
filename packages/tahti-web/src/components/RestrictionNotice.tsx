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

function RestrictionAlert({ restriction }: { restriction: MyRestriction }) {
  return (
    <Alert
      tone="warning"
      icon={<BanIcon aria-hidden className="size-4" />}
      title={`${BLOCKED[restriction.type]}${untilLabel(restriction.expiresAt)}`}
    >
      <p>Reason: {restriction.reason}</p>
      <p className="mt-1">
        Ask the board through Help → Support if you think this is a mistake.
      </p>
    </Alert>
  );
}

function useMyRestrictions(): MyRestriction[] {
  const [rows, setRows] = useState<MyRestriction[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchMyRestrictions().then((result) => {
      if (!cancelled) {
        setRows(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rows;
}

/** Says up front that the board has blocked this kind of action on the
 * account, with its reason, instead of leaving the artist to find out from
 * a refused upload or booking. Renders nothing when there is no ban. */
export function RestrictionNotice({ type }: { type: RestrictionType }) {
  const restriction = useMyRestrictions().find((row) => row.type === type);
  return restriction ? <RestrictionAlert restriction={restriction} /> : null;
}

/** Every active restriction on the account, for Settings → Account. */
export function RestrictionNotices() {
  const rows = useMyRestrictions();
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <RestrictionAlert key={row.type} restriction={row} />
      ))}
    </div>
  );
}
