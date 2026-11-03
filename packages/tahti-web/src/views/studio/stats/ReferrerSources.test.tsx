// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../../../api/studio-extras';
import { ReferrerSources } from './ReferrerSources';

const sources = (items: [string, number][]) => {
  const total = items.reduce((sum, [, count]) => sum + count, 0);
  return {
    data: {
      dimension: 'source' as const,
      total,
      minBucket: 5,
      items: items.map(([name, count]) => ({
        name,
        count,
        share: count / total,
      })),
    },
    meta: { source: 'api' as const },
  };
};

describe('ReferrerSources', () => {
  let fetchAudience: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchAudience = vi.spyOn(extras, 'fetchStatsAudience').mockResolvedValue(
      sources([
        ['Direct', 6],
        ['instagram.com', 3],
        ['Other', 1],
      ]),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists referring sites with listen counts and shares', async () => {
    await act(async () => {
      render(<ReferrerSources window={{ range: '7', soundId: 's1' }} />);
    });
    const list = screen.getByTestId('stats-referrers');
    expect(within(list).getByText('instagram.com · 3 listens')).toBeTruthy();
    expect(
      within(list).getByText('Direct or unknown · 6 listens'),
    ).toBeTruthy();
    expect(within(list).getByText('Other sites · 1 listen')).toBeTruthy();
    expect(within(list).getByText('60 %')).toBeTruthy();
    expect(fetchAudience).toHaveBeenCalledWith('source', {
      range: '7',
      from: undefined,
      to: undefined,
      soundId: 's1',
    });
  });

  it('says sources fill in when there are no listens yet', async () => {
    fetchAudience.mockResolvedValue(sources([]));
    await act(async () => {
      render(<ReferrerSources window={{ range: '30' }} />);
    });
    expect(screen.getByText('Sources fill in as people listen.')).toBeTruthy();
  });

  it('shows a retry when the API fails', async () => {
    fetchAudience.mockResolvedValue({
      data: { dimension: 'source', total: 0, minBucket: 5, items: [] },
      meta: { source: 'api', reason: '500' },
    });
    await act(async () => {
      render(<ReferrerSources window={{ range: '30' }} />);
    });
    expect(
      screen.getByText('Could not load where listeners came from'),
    ).toBeTruthy();
  });
});
