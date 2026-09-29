// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/chat-daily-listeners';
import { ChatDailyListeners } from './ChatDailyListeners';

async function renderCount(data: api.ChatDailyListeners | null) {
  const spy = vi
    .spyOn(api, 'fetchChatDailyListeners')
    .mockResolvedValue({ data, meta: { source: 'api' } });
  await act(async () => {
    render(<ChatDailyListeners slug="night-drive" />);
  });
  return spy;
}

describe('ChatDailyListeners', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows today's listeners for the channel", async () => {
    const spy = await renderCount({ count: 27, enabled: true });
    expect(spy).toHaveBeenCalledWith('night-drive');
    expect(screen.getByTestId('chat-daily-listeners').textContent).toBe(
      '27 listeners today',
    );
  });

  it('stays hidden when the artist turned the count off', async () => {
    await renderCount({ count: 27, enabled: false });
    expect(screen.queryByTestId('chat-daily-listeners')).toBeNull();
  });

  it('stays hidden with no listeners or a failed request', async () => {
    await renderCount({ count: 0, enabled: true });
    expect(screen.queryByTestId('chat-daily-listeners')).toBeNull();
    cleanup();
    await renderCount(null);
    expect(screen.queryByTestId('chat-daily-listeners')).toBeNull();
  });
});
