import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as calendar from '../../api/event-calendar';
import { EventSharesPanel } from './EventSharesPanel';

describe('EventSharesPanel', () => {
  it('shows each announcement and retries a failed one', async () => {
    vi.spyOn(calendar, 'fetchEventShares').mockResolvedValue({
      data: [
        {
          id: 's1',
          platform: 'MASTODON',
          state: 'SENT',
          error: null,
          createdAt: '2030-01-01T00:00:00.000Z',
          sentAt: '2030-01-01T00:01:00.000Z',
        },
        {
          id: 's2',
          platform: 'BLUESKY',
          state: 'FAILED',
          error: 'Session expired',
          createdAt: '2030-01-01T00:00:00.000Z',
          sentAt: null,
        },
      ],
      meta: { source: 'api' },
    });
    const retry = vi.spyOn(calendar, 'retryEventShare').mockResolvedValue({
      ok: true,
      data: {
        id: 's2',
        platform: 'BLUESKY',
        state: 'PENDING',
        error: null,
        createdAt: '2030-01-01T00:00:00.000Z',
        sentAt: null,
      },
    });
    await act(async () => {
      render(<EventSharesPanel eventId="e1" />);
    });
    expect(screen.getByText('Posted')).toBeInTheDocument();
    expect(screen.getByText('Session expired')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(retry).toHaveBeenCalledWith('e1', 's2');
    expect(screen.getByText('Sending')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('renders nothing when the event was never shared', async () => {
    vi.spyOn(calendar, 'fetchEventShares').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(<EventSharesPanel eventId="e1" />).container;
    });
    expect(container).toBeEmptyDOMElement();
  });
});
