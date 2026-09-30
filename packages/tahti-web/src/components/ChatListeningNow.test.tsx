// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as presence from '../api/channel-presence';
import { ChatListeningNow } from './ChatListeningNow';

describe('ChatListeningNow', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows how many people are listening', async () => {
    vi.spyOn(presence, 'fetchChannelPresence').mockResolvedValue(1204);
    render(<ChatListeningNow slug="aino" />);
    expect((await screen.findByTestId('chat-listening-now')).textContent).toBe(
      '· 1,204 listening',
    );
  });

  it('stays hidden when nobody is connected', async () => {
    const load = vi
      .spyOn(presence, 'fetchChannelPresence')
      .mockResolvedValue(0);
    render(<ChatListeningNow slug="aino" />);
    await vi.waitFor(() => expect(load).toHaveBeenCalledWith('aino'));
    expect(screen.queryByTestId('chat-listening-now')).toBeNull();
  });

  it('refreshes the count every 30 seconds', async () => {
    vi.useFakeTimers();
    const load = vi
      .spyOn(presence, 'fetchChannelPresence')
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);
    render(<ChatListeningNow slug="aino" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('chat-listening-now').textContent).toBe(
      '· 3 listening',
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('chat-listening-now').textContent).toBe(
      '· 5 listening',
    );
  });
});
