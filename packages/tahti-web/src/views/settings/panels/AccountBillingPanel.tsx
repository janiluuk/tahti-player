import { Link } from '@tanstack/react-router';
import {
  CalendarClock,
  CreditCardIcon,
  Music2,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink, StatTile, toast } from '@tahti-player/ui';

import {
  cancelMySubscription,
  fetchMyPurchases,
  fetchMySubscriptions,
} from '../../../api/client';
import type { FanSubscriptionRow, PurchaseRow } from '../../../api/types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { FanSubscriptionsBillingButton } from '../../../components/FanSubscriptionsBillingButton';
import { ListingDate } from '../../../components/ListingDate';
import { PageEmpty, PageError } from '../../../components/PageStates';
import {
  fanSubscriptionStatusLabel,
  hasPortalManagedSubscription,
  isCanceledAtPeriodEnd,
} from '../../../lib/fanSubscriptionStatus';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';

export function euros(cents: number | string): string {
  const n = typeof cents === 'string' ? Number(cents) : cents;
  if (!Number.isFinite(n)) {
    return '—';
  }
  return `€${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

/** Subscriptions still billing next period (not cancelled, not ended). */
export function activeSubscriptions(
  rows: FanSubscriptionRow[],
): FanSubscriptionRow[] {
  return rows.filter(
    (row) =>
      !isCanceledAtPeriodEnd(row) &&
      ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(row.state.toUpperCase()),
  );
}

function statusColor(
  row: FanSubscriptionRow,
): 'green' | 'yellow' | 'secondary' {
  if (isCanceledAtPeriodEnd(row)) {
    return 'yellow';
  }
  const state = row.state.toUpperCase();
  if (state === 'ACTIVE' || state === 'TRIALING') {
    return 'green';
  }
  if (state === 'PAST_DUE') {
    return 'yellow';
  }
  return 'secondary';
}

/** Settings → Account → Subs & purchases: what you pay artists monthly and
 * what you have bought, with totals on top. */
export function AccountBillingPanel() {
  const { t } = useTranslation('web');
  const closeSettings = useSettingsModalStore((s) => s.close);
  const focusPurchases = useSettingsModalStore(
    (s) => s.accountSection === 'purchases',
  );
  const subsHeadingId = useId();
  const purchasesHeadingId = useId();
  const purchasesRef = useRef<HTMLElement>(null);
  const [subscriptions, setSubscriptions] = useState<FanSubscriptionRow[]>([]);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(
    null,
  );
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<FanSubscriptionRow | null>(
    null,
  );
  const [cancelBusy, setCancelBusy] = useState(false);

  const reloadSubscriptions = () =>
    fetchMySubscriptions().then((r) => {
      setSubscriptions(r.data);
      setSubscriptionsError(
        r.meta.source === 'api' ? (r.meta.reason ?? null) : null,
      );
    });

  const reloadPurchases = () =>
    fetchMyPurchases().then((r) => {
      setPurchases(r.data);
      setPurchasesError(
        r.meta.source === 'api' ? (r.meta.reason ?? null) : null,
      );
    });

  useEffect(() => {
    void reloadSubscriptions();
    void reloadPurchases();
  }, []);

  useEffect(() => {
    if (focusPurchases) {
      purchasesRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [focusPurchases]);

  const active = activeSubscriptions(subscriptions);
  const monthlyCents = active.reduce((sum, row) => sum + row.amountCents, 0);
  const spentCents = purchases.reduce(
    (sum, row) => sum + Number(row.amountCents),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        data-testid="account-billing-summary"
      >
        <StatTile
          label={t('settingsBody.account.statActiveSubs')}
          value={active.length}
          tone="purple"
          icon={<Wallet size={14} />}
        />
        <StatTile
          label={t('settingsBody.account.statMonthly')}
          value={euros(monthlyCents)}
          sublabel={t('settingsBody.account.statMonthlySub')}
          tone="green"
          icon={<CalendarClock size={14} />}
        />
        <StatTile
          label={t('settingsBody.account.statPurchases')}
          value={purchases.length}
          tone="blue"
          icon={<ReceiptText size={14} />}
        />
        <StatTile
          label={t('settingsBody.account.statSpent')}
          value={euros(spentCents)}
          sublabel={t('settingsBody.account.statSpentSub')}
          tone="orange"
          icon={<CreditCardIcon size={14} />}
        />
      </div>

      <section aria-labelledby={subsHeadingId} className="flex flex-col gap-3">
        <h3 id={subsHeadingId} className="font-semibold">
          {t('settingsBody.account.tabSubscriptions')}
        </h3>
        {subscriptionsError && subscriptions.length === 0 ? (
          <PageError
            title={t('settingsBody.account.subscriptionsLoadError')}
            description={subscriptionsError}
            onRetry={() => void reloadSubscriptions()}
          />
        ) : subscriptions.length === 0 ? (
          <PageEmpty title={t('settingsBody.account.subscriptionsEmpty')} />
        ) : (
          <ul className="border-border divide-border divide-y rounded-lg border">
            {subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                data-testid="account-subscription"
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    to="/u/$username"
                    params={{ username: subscription.artist.username }}
                    onClick={closeSettings}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {subscription.artist.displayName}
                  </Link>
                  <span className="text-foreground-secondary text-xs">
                    {subscription.tierName} ·{' '}
                    {t('settingsBody.account.perMonth', {
                      amount: euros(subscription.amountCents),
                    })}
                  </span>
                </div>
                <Badge variant="pill" color={statusColor(subscription)}>
                  {fanSubscriptionStatusLabel(subscription)}
                </Badge>
                {isCanceledAtPeriodEnd(subscription) ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingCancel(subscription)}
                  >
                    {t('settingsBody.account.manage')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {hasPortalManagedSubscription(subscriptions) ? (
          <FanSubscriptionsBillingButton />
        ) : null}
      </section>

      <section
        ref={purchasesRef}
        aria-labelledby={purchasesHeadingId}
        className="flex scroll-mt-4 flex-col gap-3"
      >
        <h3 id={purchasesHeadingId} className="font-semibold">
          {t('settingsBody.account.tabPurchases')}
        </h3>
        {purchasesError && purchases.length === 0 ? (
          <PageError
            title={t('settingsBody.account.purchasesLoadError')}
            description={purchasesError}
            onRetry={() => void reloadPurchases()}
          />
        ) : purchases.length === 0 ? (
          <PageEmpty title={t('settingsBody.account.purchasesEmpty')} />
        ) : (
          <ul className="border-border divide-border divide-y rounded-lg border">
            {purchases.map((purchase) => (
              <li
                key={purchase.id}
                data-testid="account-purchase"
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  aria-hidden
                  className="bg-accent-blue/15 text-accent-blue-strong flex size-9 shrink-0 items-center justify-center rounded-full"
                >
                  <Music2 size={16} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold">
                    {purchase.tracks.map((track) => track.title).join(', ') ||
                      purchase.tierName}
                  </span>
                  <span className="text-foreground-secondary text-xs">
                    <Link
                      to="/u/$username"
                      params={{ username: purchase.artist.username }}
                      onClick={closeSettings}
                      className="underline-offset-2 hover:underline"
                    >
                      {purchase.artist.displayName}
                    </Link>
                    {' · '}
                    <ListingDate value={purchase.createdAt} />
                  </span>
                </div>
                <span className="font-semibold tabular-nums">
                  {euros(purchase.amountCents)}
                </span>
                {purchase.tracks[0] ? (
                  <ButtonLink
                    to="/t/$id"
                    params={{ id: purchase.tracks[0].id }}
                    onClick={closeSettings}
                    variant="ghost"
                    size="sm"
                  >
                    {t('accountPanelText.listen')}
                  </ButtonLink>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        destructive
        isOpen={pendingCancel !== null}
        title={
          pendingCancel
            ? t('settingsBody.account.cancelSubscriptionNamed', {
                tier: pendingCancel.tierName,
                artist: pendingCancel.artist.displayName,
              })
            : t('settingsBody.account.cancelSubscriptionTitle')
        }
        description={t('settingsBody.account.cancelSubscriptionDescription')}
        confirmLabel={
          cancelBusy
            ? t('settingsBody.account.cancelSubscriptionBusy')
            : t('settingsBody.account.cancelSubscriptionConfirm')
        }
        cancelLabel={t('settingsBody.account.keepSubscription')}
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => {
          const target = pendingCancel;
          if (!target || cancelBusy) {
            return;
          }
          setCancelBusy(true);
          void cancelMySubscription(target.id).then((r) => {
            setCancelBusy(false);
            setPendingCancel(null);
            if (r.ok) {
              void reloadSubscriptions();
            } else {
              toast.error(r.error);
            }
          });
        }}
      />
    </div>
  );
}
