// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/rtmp-status';
import { MultistreamStatusPanel } from './MultistreamStatusPanel';

describe('MultistreamStatusPanel', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows each destination and refreshes while it has any', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(api, 'fetchRtmpTargetStatuses').mockResolvedValue({
      data: [
        {
          id: 't1',
          provider: 'youtube',
          label: 'YouTube',
          enabled: true,
          status: 'connected',
        },
        {
          id: 't2',
          provider: 'twitch',
          label: 'Twitch',
          enabled: true,
          status: 'error',
          lastError: 'Stream key rejected',
        },
        {
          id: 't3',
          provider: 'custom',
          label: '',
          enabled: false,
          status: 'disabled',
        },
      ],
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<MultistreamStatusPanel slug="night-drive" />);
    });
    expect(spy).toHaveBeenCalledWith('night-drive');
    const rows = within(screen.getByTestId('multistream-status')).getAllByRole(
      'listitem',
    );
    expect(rows[0]!.textContent).toBe('YouTubeStreaming');
    expect(rows[1]!.textContent).toContain('Stream key rejected');
    expect(rows[2]!.textContent).toBe('customOff');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('renders nothing without destinations or on failure', async () => {
    vi.spyOn(api, 'fetchRtmpTargetStatuses').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    const { container } = await act(async () =>
      render(<MultistreamStatusPanel slug="night-drive" />),
    );
    expect(container.textContent).toBe('');
  });
});
