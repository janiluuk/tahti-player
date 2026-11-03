// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { TransparencyResolutionsView } from './TransparencyResolutionsView';

describe('TransparencyResolutionsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('dates each resolution in the listing style', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00.000Z'));
    vi.spyOn(client, 'fetchTransparencyResolutions').mockResolvedValue({
      data: [
        {
          id: 'r1',
          title: 'Fee for 2027',
          body: 'The fee stays at 40 euros.',
          votedAt: '2026-10-28T12:00:00.000Z',
          outcome: 'PASSED',
          voteFor: 5,
          voteAgainst: 0,
          voteAbstain: 1,
        },
        {
          id: 'r2',
          title: 'Festival stage',
          body: 'Tahti books a stage.',
          votedAt: '2026-09-05T12:00:00.000Z',
          outcome: 'PASSED',
          voteFor: 4,
          voteAgainst: 2,
          voteAbstain: 0,
        },
      ],
      meta: { source: 'api' },
    });
    await renderWithRouter(<TransparencyResolutionsView />);
    const recent = await screen.findByText('2 days ago');
    expect(recent.tagName).toBe('TIME');
    expect(recent.getAttribute('datetime')).toBe('2026-10-28T12:00:00.000Z');
    expect(screen.getByText('5.9.2026').tagName).toBe('TIME');
  });

  it('says the resolutions failed to load instead of "No published resolutions"', async () => {
    const fetch = vi
      .spyOn(client, 'fetchTransparencyResolutions')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    await renderWithRouter(<TransparencyResolutionsView />);
    expect(
      await screen.findByText('Could not load the resolutions'),
    ).toBeTruthy();
    expect(screen.queryByText(/No published resolutions/)).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No published resolutions/)).toBeTruthy();
  });
});
