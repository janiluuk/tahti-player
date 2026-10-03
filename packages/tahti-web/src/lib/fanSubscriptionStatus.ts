import type { FanSubscriptionRow } from '../api/types';

type StatusFields = Pick<
  FanSubscriptionRow,
  'state' | 'canceledAt' | 'currentPeriodEnd'
>;

function periodEnd(sub: StatusFields): Date | null {
  if (!sub.currentPeriodEnd) {
    return null;
  }
  const end = new Date(sub.currentPeriodEnd);
  return Number.isNaN(end.getTime()) ? null : end;
}

export function isCanceledAtPeriodEnd(sub: StatusFields): boolean {
  return Boolean(sub.canceledAt) || sub.state === 'CANCELED';
}

export function fanSubscriptionStatusLabel(sub: StatusFields): string {
  const end = periodEnd(sub);
  if (isCanceledAtPeriodEnd(sub) && end) {
    return `Ends on ${end.toLocaleDateString()}`;
  }
  return sub.state;
}

/** The billing portal manages active subscriptions and resumes canceled ones still in their paid period. */
export function hasPortalManagedSubscription(
  subs: StatusFields[],
  now: Date = new Date(),
): boolean {
  return subs.some((sub) => {
    if (sub.state === 'ACTIVE') {
      return true;
    }
    const end = periodEnd(sub);
    return sub.state === 'CANCELED' && end !== null && end > now;
  });
}
