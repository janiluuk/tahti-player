import type {
  AdminGrantHistoryDetail,
  AdminGrantYearSummary,
} from './admin-governance';

export function mockGrantHistory(): AdminGrantYearSummary[] {
  const year = new Date().getUTCFullYear();
  return [
    { year: year - 1, grantCount: 18, totalCents: 940000 },
    { year: year - 2, grantCount: 14, totalCents: 710000 },
  ];
}

export function mockGrantHistoryDetail(
  year: number,
): AdminGrantHistoryDetail | null {
  const summary = mockGrantHistory().find((entry) => entry.year === year);
  if (!summary) {
    return null;
  }
  const names = ['Northern Lights', 'Kaiku Collective', null, 'DJ Moonlight'];
  const share = Math.floor(summary.totalCents / summary.grantCount);
  return {
    ...summary,
    disbursedAt: `${year + 1}-01-15T10:00:00.000Z`,
    grants: Array.from({ length: summary.grantCount }, (_, index) => ({
      publishedAs: names[index % names.length],
      units: 40 - index,
      amountCents: String(
        index === 0
          ? summary.totalCents - share * (summary.grantCount - 1)
          : share,
      ),
      state: 'PAID',
    })),
  };
}
