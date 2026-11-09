// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioStatsView } from './StudioStatsView';

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./stats/useStatsData', () => ({
  useStatsData: () => ({ loading: false, loadError: null, range: '30' }),
}));
vi.mock('./stats/RangeControls', () => ({ RangeControls: () => null }));
vi.mock('./stats/OverviewTab', () => ({
  KeyMetrics: () => null,
  EngagementSection: () => null,
}));
vi.mock('./stats/ReferrerSources', () => ({ ReferrerSources: () => null }));
vi.mock('./stats/DownloadGatesPanel', () => ({
  DownloadGatesPanel: () => null,
}));
vi.mock('./stats/PlaysTab', () => ({ PlaysTab: () => null }));
vi.mock('./stats/TopListsTab', () => ({ TopListsTab: () => null }));
vi.mock('./stats/HourlyDialog', () => ({ HourlyDialog: () => null }));

describe('StudioStatsView scrolling', () => {
  const scrolled: string[] = [];

  beforeEach(() => {
    scrolled.length = 0;
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
      scrolled.push(this.id);
    };
  });

  afterEach(cleanup);

  it('keeps the title and tabs in view when opened on Overview', async () => {
    await renderWithRouter(<StudioStatsView />, { paths: ['/studio/stats'] });
    expect(screen.getByRole('radio', { name: 'Overview' })).toBeTruthy();
    expect(scrolled).toEqual([]);
  });

  it('scrolls to a deep-linked section', async () => {
    await renderWithRouter(<StudioStatsView tab="plays" />, {
      paths: ['/studio/stats'],
    });
    expect(scrolled).toEqual(['stats-plays']);
  });

  it('scrolls to the section the user picks', async () => {
    await renderWithRouter(<StudioStatsView />, { paths: ['/studio/stats'] });
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Top lists' }));
    });
    expect(scrolled).toEqual(['stats-top-lists']);
  });
});
