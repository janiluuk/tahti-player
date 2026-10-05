// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/blocks';
import { useAuthStore, type AuthUser } from '../../stores/authStore';
import { ArtistBlockButton } from './ArtistBlockButton';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const AINO: api.BlockedUser = {
  username: 'aino',
  displayName: 'Aino',
  avatarUrl: null,
  blockedAt: '2026-10-05T10:00:00.000Z',
};

async function renderButton(blocked: api.BlockedUser[], signedIn = true) {
  useAuthStore.setState({
    user: signedIn ? ({ username: 'me' } as AuthUser) : null,
  });
  vi.spyOn(api, 'fetchBlockedUsers').mockResolvedValue(blocked);
  await act(async () => {
    render(<ArtistBlockButton username="aino" displayName="Aino" />);
  });
}

describe('ArtistBlockButton', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('is not shown to signed-out visitors', async () => {
    await renderButton([], false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('blocks only after the confirm', async () => {
    const block = vi
      .spyOn(api, 'blockUser')
      .mockResolvedValue({ ok: true, data: AINO });
    await renderButton([]);
    fireEvent.click(screen.getByRole('button', { name: 'Block Aino' }));
    expect(block).not.toHaveBeenCalled();
    expect(screen.getByText('Block Aino?')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    });
    expect(block).toHaveBeenCalledWith('aino');
  });

  it('unblocks an already blocked artist at once', async () => {
    const unblock = vi
      .spyOn(api, 'unblockUser')
      .mockResolvedValue({ ok: true });
    await renderButton([AINO]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unblock Aino' }));
    });
    expect(unblock).toHaveBeenCalledWith('aino');
    expect(screen.getByRole('button', { name: 'Block Aino' })).toBeTruthy();
  });
});
