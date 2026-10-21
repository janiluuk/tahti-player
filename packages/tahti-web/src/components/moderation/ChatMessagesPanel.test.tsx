// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/chat-moderation';
import { useAuthStore } from '../../stores/authStore';
import { ChatMessagesPanel } from './ChatMessagesPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const message = (
  over: Partial<api.ModerationChatMessage>,
): api.ModerationChatMessage => ({
  id: 'm1',
  handle: 'Promo Bot',
  text: 'cheap followers',
  fanOnly: false,
  channelRole: null,
  createdAt: '2026-10-08T19:42:00.000Z',
  canBan: true,
  banned: false,
  ...over,
});

async function renderPanel(
  messages: api.ModerationChatMessage[],
  props: Parameters<typeof ChatMessagesPanel>[0] = {},
) {
  const fetch = vi
    .spyOn(api, 'fetchModerationMessages')
    .mockResolvedValue({ ok: true, data: messages });
  await act(async () => {
    render(<ChatMessagesPanel {...props} />);
  });
  return fetch;
}

describe('ChatMessagesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it("loads the signed-in account's own channel unless another one is given", async () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'artist', channel: { slug: 'artist' } },
    } as never);
    const own = await renderPanel([]);
    expect(own).toHaveBeenCalledWith('artist');
    expect(screen.getByText('No messages yet')).toBeTruthy();
    cleanup();

    const other = await renderPanel([], { slug: 'someone-else' });
    expect(other).toHaveBeenLastCalledWith('someone-else');
  });

  it('bans the sender of a message after a confirm and tells the ban list', async () => {
    const ban = vi
      .spyOn(api, 'banChatMessageSender')
      .mockResolvedValue({ ok: true });
    const onBanned = vi.fn();
    const fetch = await renderPanel([message({})], {
      slug: 'artist',
      onBanned,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ban Promo Bot' }));
    expect(ban).not.toHaveBeenCalled();
    expect(screen.getByText('Ban Promo Bot from this chat?')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ban' }));
    });

    expect(ban).toHaveBeenCalledWith('artist', 'm1');
    expect(toast.success).toHaveBeenCalledWith(
      'Promo Bot can no longer post in this chat.',
    );
    expect(onBanned).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('removes a message after a confirm', async () => {
    const remove = vi
      .spyOn(api, 'removeChatMessage')
      .mockResolvedValue({ ok: true });
    await renderPanel([message({})], { slug: 'artist' });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove message from Promo Bot' }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    });
    expect(remove).toHaveBeenCalledWith('artist', 'm1');
    expect(toast.success).toHaveBeenCalledWith('Message removed.');
  });

  it('offers no ban for staff, old messages or someone already banned', async () => {
    await renderPanel(
      [
        message({
          id: 'a',
          handle: 'The Artist',
          channelRole: 'owner',
          canBan: false,
        }),
        message({ id: 'b', handle: 'Old Timer', canBan: false }),
        message({ id: 'c', handle: 'Spammer', banned: true, fanOnly: true }),
      ],
      { slug: 'artist' },
    );
    expect(screen.queryByRole('button', { name: /^Ban / })).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /^Remove message/ }),
    ).toHaveLength(3);
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('Banned')).toBeTruthy();
    expect(screen.getByText('Fan room')).toBeTruthy();
  });

  it('says so when the list cannot be loaded or an action fails', async () => {
    vi.spyOn(api, 'fetchModerationMessages').mockResolvedValue({
      ok: false,
      error: 'Channel not found',
    });
    await act(async () => {
      render(<ChatMessagesPanel slug="artist" />);
    });
    expect(screen.getByRole('alert').textContent).toBe('Channel not found');
    cleanup();

    vi.spyOn(api, 'removeChatMessage').mockResolvedValue({
      ok: false,
      error: "Only the channel's owner can remove this message",
    });
    await renderPanel([message({})], { slug: 'artist' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove message from Promo Bot' }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Only the channel's owner can remove this message",
    );
  });
});
