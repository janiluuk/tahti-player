import { useCallback, useEffect, useState } from 'react';

import {
  useTranslation,
  type ParseKeys,
  type TFunction,
} from '@tahti-player/i18n';
import { Badge, Button, InlineError, Select, Textarea } from '@tahti-player/ui';

import {
  createAccountRestriction,
  fetchAccountRestrictions,
  isRestrictionActive,
  liftAccountRestriction,
  type AccountRestriction,
  type AccountRestrictionType,
} from '../../api/admin';
import { dateLocaleTag } from '../../lib/locale';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

const TYPE_LABEL_KEYS = {
  LOGIN: 'adminUserRestrictionsPanelBatch31.typeLogin',
  UPLOAD: 'adminUserRestrictionsPanelBatch31.typeUpload',
  LIVE_SHOW_BOOKING: 'adminUserRestrictionsPanelBatch31.typeLiveShowBooking',
} as const satisfies Record<AccountRestrictionType, ParseKeys<'web'>>;

const TYPE_HELP_KEYS = {
  LOGIN: 'adminUserRestrictionsPanelBatch31.helpLogin',
  UPLOAD: 'adminUserRestrictionsPanelBatch31.helpUpload',
  LIVE_SHOW_BOOKING: 'adminUserRestrictionsPanelBatch31.helpLiveShowBooking',
} as const satisfies Record<AccountRestrictionType, ParseKeys<'web'>>;

function durationOptions(t: TFunction<'web'>) {
  return [
    { id: '', label: t('adminUserRestrictionsPanelBatch31.untilLiftedOption') },
    ...[1, 7, 30, 90].map((count) => ({
      id: String(count),
      label: t('adminUserRestrictionsPanelBatch31.days', { count }),
    })),
    { id: '365', label: t('adminUserRestrictionsPanelBatch31.oneYear') },
  ];
}

function describeRestriction(
  restriction: AccountRestriction,
  t: TFunction<'web'>,
): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString(dateLocaleTag());
  const parts = [
    t('adminUserRestrictionsPanelBatch31.since', {
      date: format(restriction.bannedAt),
    }),
  ];
  if (restriction.liftedAt) {
    parts.push(
      t('adminUserRestrictionsPanelBatch31.liftedOn', {
        date: format(restriction.liftedAt),
      }),
    );
  } else if (restriction.expiresAt) {
    const date = format(restriction.expiresAt);
    parts.push(
      isRestrictionActive(restriction)
        ? t('adminUserRestrictionsPanelBatch31.until', { date })
        : t('adminUserRestrictionsPanelBatch31.expired', { date }),
    );
  } else {
    parts.push(t('adminUserRestrictionsPanelBatch31.untilLifted'));
  }
  if (restriction.bannedByUsername) {
    parts.push(
      t('adminUserRestrictionsPanelBatch31.byUser', {
        username: restriction.bannedByUsername,
      }),
    );
  }
  return parts.join(' · ');
}

export function AdminUserRestrictionsPanel({ userId }: { userId: string }) {
  const { t } = useTranslation('web');
  const [items, setItems] = useState<AccountRestriction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<AccountRestrictionType>('UPLOAD');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAccountRestrictions(userId).then((result) => {
      if (!cancelled) {
        setItems(result.data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => load(), [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    const result = await createAccountRestriction(userId, {
      type,
      reason,
      durationDays: duration ? Number(duration) : null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReason('');
    load();
  };

  const lift = async (restriction: AccountRestriction) => {
    setBusy(true);
    setError(null);
    const result = await liftAccountRestriction(userId, restriction.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    load();
  };

  const active = (items ?? []).filter((item) => isRestrictionActive(item));
  const past = (items ?? []).filter((item) => !isRestrictionActive(item));

  return (
    <StudioPanel
      title={t('adminUserRestrictionsPanel.restrictions')}
      description={t(
        'adminUserRestrictionsPanel.blockOneThingWithoutSuspending',
      )}
    >
      {loading && !items ? (
        <PageLoading label={t('loading.loadingRestrictions')} />
      ) : !items ? (
        <PageError
          title={t('loadErrors.couldnTLoadRestrictions')}
          onRetry={() => void load()}
        />
      ) : (
        <div className="flex flex-col gap-4" data-testid="admin-restrictions">
          {active.length === 0 ? (
            <PageEmpty title={t('empties.noRestrictions')} />
          ) : (
            <ul className="divide-border divide-y text-sm">
              {active.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <Badge variant="pill" color="red">
                        {t(TYPE_LABEL_KEYS[item.type])}
                      </Badge>
                      <span className="break-words">{item.reason}</span>
                    </span>
                    <span className="text-foreground-secondary text-xs">
                      {describeRestriction(item, t)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    aria-label={t(
                      'adminUserRestrictionsPanelBatch31.liftType',
                      {
                        type: t(TYPE_LABEL_KEYS[item.type]).toLowerCase(),
                      },
                    )}
                    onClick={() => void lift(item)}
                  >
                    {t('adminUserRestrictionsPanel.lift')}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="border-border flex flex-col gap-3 border-t pt-4"
            aria-label={t('adminUserRestrictionsPanel.addARestriction')}
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim() && !busy) {
                void add();
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={t('adminUserRestrictionsPanel.restrict')}
                value={type}
                onValueChange={(value) =>
                  setType(value as AccountRestrictionType)
                }
                options={(
                  Object.keys(TYPE_LABEL_KEYS) as AccountRestrictionType[]
                ).map((id) => ({ id, label: t(TYPE_LABEL_KEYS[id]) }))}
              />
              <Select
                label={t('adminUserRestrictionsFields.duration')}
                value={duration}
                onValueChange={setDuration}
                options={durationOptions(t)}
              />
            </div>
            <p className="text-foreground-secondary text-xs">
              {t(TYPE_HELP_KEYS[type])}
            </p>
            <Textarea
              submitOnModEnter
              label={t('adminUserRestrictionsPanel.reason')}
              tone="secondary"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t('adminUserRestrictionsPanel.shownToTheUser')}
            />
            {error ? <InlineError>{error}</InlineError> : null}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={busy || !reason.trim()}>
                {t('adminUserRestrictionsPanel.addRestriction')}
              </Button>
            </div>
          </form>

          {past.length > 0 ? (
            <details className="text-sm">
              <summary className="text-foreground-secondary cursor-pointer text-xs uppercase">
                {t('adminUserRestrictionsPanelBatch31.pastRestrictions', {
                  count: past.length,
                })}
              </summary>
              <ul className="divide-border mt-2 divide-y">
                {past.map((item) => (
                  <li key={item.id} className="py-2">
                    <span className="block">
                      {t(TYPE_LABEL_KEYS[item.type])}: {item.reason}
                    </span>
                    <span className="text-foreground-secondary text-xs">
                      {describeRestriction(item, t)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      )}
    </StudioPanel>
  );
}
