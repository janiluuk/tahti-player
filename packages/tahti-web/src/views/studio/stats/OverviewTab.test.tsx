// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EngagementSection } from './OverviewTab';
import type { StatsData } from './useStatsData';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const state = {
  engagementEntries: [
    {
      id: 'free-downloads',
      label: 'Free downloads',
      sublabel: '40 × 1',
      value: 40,
    },
    {
      id: 'paid-downloads',
      label: 'Paid downloads',
      sublabel: '12 × 5',
      value: 60,
    },
    {
      id: 'fan-subs',
      label: 'Fan subscriptions',
      sublabel: '€35 × 1',
      value: 35,
    },
  ],
  grant: { eligible: true, year: 2026, estimateCents: 12000 },
} as unknown as StatsData;

describe('Stats overview, engagement units', () => {
  afterEach(cleanup);

  it('names each source in full with its sum and units', () => {
    render(<EngagementSection state={state} active />);
    const rows = within(screen.getByTestId('engagement-units')).getAllByRole(
      'listitem',
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      'Free downloads 40 × 140',
      'Paid downloads 12 × 560',
      'Fan subscriptions €35 × 135',
    ]);
    expect(screen.getByText('€120.00')).toBeTruthy();
  });

  it('draws no bar wider than the row when every source is zero', () => {
    const empty = {
      ...state,
      engagementEntries: state.engagementEntries.map((entry) => ({
        ...entry,
        value: 0,
      })),
    } as StatsData;
    const { container } = render(<EngagementSection state={empty} active />);
    const bars = [...container.querySelectorAll('[aria-hidden] > div')].map(
      (bar) => (bar as HTMLElement).style.width,
    );
    expect(bars).toEqual(['0%', '0%', '0%']);
  });
});
