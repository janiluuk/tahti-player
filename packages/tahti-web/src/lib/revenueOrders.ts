import type { FanSubPayout } from '../api/revenue';
import type { RevelatorRoyaltyReportRow } from '../api/studio-types';

export const REVENUE_ORDER_ROW_LIMIT = 12;

export type RevenueOrderRow = {
  id: string;
  date: Date;
  description: string;
  grossCents: number | null;
  netCents: number;
  state: string;
};

export function mergeRevenueOrders(
  payouts: FanSubPayout[],
  royalties: RevelatorRoyaltyReportRow[],
  limit = REVENUE_ORDER_ROW_LIMIT,
): RevenueOrderRow[] {
  const rows: RevenueOrderRow[] = [
    ...payouts.map((payout) => ({
      id: payout.id,
      date: new Date(payout.paidAt ?? payout.createdAt),
      description: payout.tierName.startsWith('Track purchase')
        ? payout.tierName
        : `Fan-sub — ${payout.tierName}`,
      grossCents: payout.grossCents,
      netCents: payout.netToArtistCents,
      state: payout.state,
    })),
    ...royalties.map((royalty) => ({
      id: royalty.id,
      date: new Date(royalty.periodEnd),
      description: `Distribution royalties — ${royalty.releaseTitle}`,
      grossCents: null,
      netCents: royalty.amountCents,
      state: 'PAID',
    })),
  ];

  return rows
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, limit);
}
