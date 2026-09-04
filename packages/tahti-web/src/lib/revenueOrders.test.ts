import { describe, expect, it } from 'vitest';

import type { FanSubPayout } from '../api/revenue';
import type { RevelatorRoyaltyReportRow } from '../api/studio-types';
import { mergeRevenueOrders } from './revenueOrders';

const payout = (
  overrides: Partial<FanSubPayout> & { id: string },
): FanSubPayout => ({
  state: 'PAID',
  tierName: 'Supporter',
  grossCents: 500,
  netToArtistCents: 445,
  paidAt: '2026-08-01T10:00:00.000Z',
  createdAt: '2026-08-01T09:58:00.000Z',
  ...overrides,
});

const royalty = (
  overrides: Partial<RevelatorRoyaltyReportRow> & { id: string },
): RevelatorRoyaltyReportRow => ({
  releaseId: 'rel-1',
  releaseTitle: 'Summer EP',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  amountCents: 1200,
  currency: 'EUR',
  streams: 400,
  syncedAt: '2026-08-05T09:00:00.000Z',
  ...overrides,
});

describe('mergeRevenueOrders', () => {
  it('merges fan-sub payouts and distribution royalties newest first', () => {
    const rows = mergeRevenueOrders(
      [
        payout({
          id: 'p1',
          paidAt: '2026-08-10T10:00:00.000Z',
          tierName: 'Patron',
        }),
      ],
      [
        royalty({
          id: 'r1',
          periodEnd: '2026-08-20',
          releaseTitle: 'Autumn Single',
        }),
      ],
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('r1');
    expect(rows[0]?.description).toBe('Distribution royalties — Autumn Single');
    expect(rows[1]?.description).toBe('Fan-sub — Patron');
  });

  it('keeps track-purchase payout labels without a Fan-sub prefix', () => {
    const rows = mergeRevenueOrders(
      [
        payout({
          id: 'buy-1',
          tierName: 'Track purchase — riff.wav',
          paidAt: '2026-08-12T10:00:00.000Z',
        }),
      ],
      [],
    );
    expect(rows[0]?.description).toBe('Track purchase — riff.wav');
  });

  it('caps the combined list at twelve rows', () => {
    const payouts = Array.from({ length: 8 }, (_, index) =>
      payout({
        id: `p${index}`,
        paidAt: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
      }),
    );
    const royalties = Array.from({ length: 8 }, (_, index) =>
      royalty({
        id: `r${index}`,
        periodEnd: `2026-09-${String(index + 1).padStart(2, '0')}`,
      }),
    );

    expect(mergeRevenueOrders(payouts, royalties)).toHaveLength(12);
  });
});
