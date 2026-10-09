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

import * as api from '../../api/artist-settings';
import { useAuthStore } from '../../stores/authStore';
import { ChatBansPanel } from './ChatBansPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const NAMED: api.ChatBan = {
  id: 'ban-1',
  fingerprintHash: 'fan-12345678',
  handle: 'Promo Bot',
  bannedAt: '2026-10-08T19:42:00.000Z',
};
const BY_HASH: api.ChatBan = {
  fingerprintHash: 'a1b2c3d4e5f6a1b2',
  bannedAt: '2026-07-20T18:00:00.000Z',
};

async function renderPanel(bans: api.ChatBan[], slug?: string) {
  const fetch = vi
    .spyOn(api, 'fetchChatBans')
    .mockResolvedValue({ data: bans, meta: { source: 'api' } } as never);
  await act(async () => {
    render(<ChatBansPanel slug={slug} />);
  });
  return fetch;
}

describe('ChatBansPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lists bans by the name the sender posted under, not by hash', async () => {
    await renderPanel([NAMED, BY_HASH], 'artist');
    expect(screen.getByText('Promo Bot')).toBeTruthy();
    expect(screen.queryByText('fan-12345678')).toBeNull();
    expect(screen.getByText('Unnamed visitor a1b2c3d4')).toBeTruthy();
  });

  it('has no field for typing a fingerprint hash', async () => {
    await renderPanel([], 'artist');
    expect(screen.getByText('Nobody is banned')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByLabelText('Fingerprint hash')).toBeNull();
  });

  it('lifts a ban and reloads the list', async () => {
    const unban = vi.spyOn(api, 'unbanChat').mockResolvedValue({ ok: true });
    const fetch = await renderPanel([NAMED], 'artist');
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Lift the ban on Promo Bot' }),
      );
    });
    expect(unban).toHaveBeenCalledWith('artist', NAMED);
    expect(toast.success).toHaveBeenCalledWith('Promo Bot can post again.');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("uses the signed-in account's channel when no channel is given", async () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'artist', channel: { slug: 'mine' } },
    } as never);
    const fetch = await renderPanel([]);
    expect(fetch).toHaveBeenCalledWith('mine');
  });
});
