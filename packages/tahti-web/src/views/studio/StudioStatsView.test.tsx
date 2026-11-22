// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  OverviewTab: () => <div>Overview panel</div>,
}));
vi.mock('./stats/AudienceTab', () => ({
  AudienceTab: () => <div>Audience panel</div>,
}));
vi.mock('./stats/PlaysTab', () => ({
  PlaysTab: () => <div>Plays panel</div>,
}));
vi.mock('./stats/TopListsTab', () => ({
  TopListsTab: () => <div>Top lists panel</div>,
}));
vi.mock('./stats/HourlyDialog', () => ({ HourlyDialog: () => null }));

describe('StudioStatsView tabs', () => {
  afterEach(cleanup);

  it('shows the Overview panel by default', async () => {
    await renderWithRouter(<StudioStatsView />, { paths: ['/studio/stats'] });
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Overview panel')).toBeTruthy();
    expect(screen.queryByText('Plays panel')).toBeNull();
  });

  it('opens the deep-linked Plays panel', async () => {
    await renderWithRouter(<StudioStatsView tab="plays" />, {
      paths: ['/studio/stats'],
    });
    expect(screen.getByRole('tab', { name: 'Plays' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Plays panel')).toBeTruthy();
    expect(screen.queryByText('Overview panel')).toBeNull();
  });

  it('navigates when the user picks a tab', async () => {
    const { router } = await renderWithRouter(<StudioStatsView />, {
      paths: ['/studio/stats'],
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Top lists' }));
    });
    expect(router.state.location.pathname).toBe('/studio/stats');
    expect(router.state.location.search).toEqual({ tab: 'top-lists' });
  });

  it('links Insights to the insights page', async () => {
    await renderWithRouter(<StudioStatsView />, {
      paths: ['/studio/stats', '/studio/insights'],
    });
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute(
      'href',
      '/studio/insights',
    );
  });
});
