import { Button } from '@tahti-player/ui';

import type { FanSubscriptionRow } from '../api/types';
import { useSettingsModalStore } from '../stores/settingsModalStore';

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}/mo`;
}

/** The viewer's active subscription to an artist, shown on the subscribe
 * page in place of the tier buttons (the API answers 409 to a second
 * checkout while one is ACTIVE). */
export function CurrentFanSubscriptionCard({
  subscription,
}: {
  subscription: FanSubscriptionRow;
}) {
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;
  return (
    <div
      className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
      data-testid="current-fan-subscription"
    >
      <div>
        <div className="font-display text-lg font-bold">
          You're subscribed: {subscription.tierName}
        </div>
        <div className="text-foreground-secondary text-sm">
          {formatEur(subscription.amountCents)}
          {periodEnd
            ? subscription.canceledAt
              ? `, ends ${periodEnd}`
              : `, renews ${periodEnd}`
            : null}
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          useSettingsModalStore
            .getState()
            .open('account', undefined, undefined, 'subscriptions')
        }
      >
        Manage subscription
      </Button>
    </div>
  );
}
