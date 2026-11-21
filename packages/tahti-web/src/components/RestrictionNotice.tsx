import { BanIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Alert } from '@tahti-player/ui';

import {
  fetchMyRestrictions,
  type MyRestriction,
  type RestrictionType,
} from '../api/me-restrictions';
import { ListingDate } from './ListingDate';

const BLOCKED = {
  UPLOAD: 'restrictionNoticeBatch35.blockedUpload',
  LIVE_SHOW_BOOKING: 'restrictionNoticeBatch35.blockedLiveShowBooking',
  LOGIN: 'restrictionNoticeBatch35.blockedLogin',
} as const satisfies Record<RestrictionType, ParseKeys<'web'>>;

function RestrictionAlert({ restriction }: { restriction: MyRestriction }) {
  const { t } = useTranslation('web');
  const blocked = t(BLOCKED[restriction.type]);
  return (
    <Alert
      tone="warning"
      icon={<BanIcon aria-hidden className="size-4" />}
      title={
        <>
          {restriction.expiresAt ? (
            <>
              {t('restrictionNoticeBatch35.titleUntil', { blocked })}{' '}
              <ListingDate value={restriction.expiresAt} />
            </>
          ) : (
            blocked
          )}
        </>
      }
    >
      <p>
        {t('restrictionNoticeBatch35.reason', { reason: restriction.reason })}
      </p>
      <p className="mt-1">{t('restrictionNoticeBatch35.askBoard')}</p>
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
