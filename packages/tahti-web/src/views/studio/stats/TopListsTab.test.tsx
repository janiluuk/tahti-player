// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TopListsTab } from './TopListsTab';
import type { StatsData } from './useStatsData';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

const state = {
  topLists: [
    {
      bucket: 'TRACK',
      entries: [
        {
          soundId: 'snd-ranked',
          title: 'Ranked Song',
          genre: 'Techno',
          contentType: 'TRACK',
          listens: 12,
        },
      ],
    },
  ],
  topListDimension: 'type',
  setTopListDimension: vi.fn(),
  topListSort: 'desc',
  setTopListSort: vi.fn(),
  tracks: [{ soundId: 'snd-top', title: 'Top Song', plays: 30 }],
  countries: [],
  topRangeLabel: 'last 30 days',
} as unknown as StatsData;

describe('Stats top lists', () => {
  afterEach(() => {
    cleanup();
    navigate.mockReset();
  });

  it('opens a ranked sound on its Insights tab', () => {
    render(<TopListsTab state={state} active />);
    fireEvent.click(screen.getByText('Ranked Song'));
    expect(navigate).toHaveBeenCalledWith({
      to: '/studio/sounds/$id',
      params: { id: 'snd-ranked' },
      search: { tab: 'insights' },
    });
  });

  it('opens a top track on its Insights tab', () => {
    render(<TopListsTab state={state} active />);
    fireEvent.click(screen.getByText('Top Song'));
    expect(navigate).toHaveBeenCalledWith({
      to: '/studio/sounds/$id',
      params: { id: 'snd-top' },
      search: { tab: 'insights' },
    });
  });
});
