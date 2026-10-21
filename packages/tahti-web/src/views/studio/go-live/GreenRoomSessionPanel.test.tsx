// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/green-room-session';
import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { GreenRoomSessionPanel } from './GreenRoomSessionPanel';

const session = (
  overrides: Partial<api.GreenRoomSession> = {},
): api.GreenRoomSession => ({
  enabled: false,
  channelState: 'PREVIEW',
  invitePool: 'MODERATORS_AND_SUBS',
  invites: [],
  candidates: [],
  ...overrides,
});

const invite = (
  userId: string,
  joinedAt: string | null,
): api.GreenRoomInvite => ({
  userId,
  username: userId,
  displayName: `Guest ${userId}`,
  source: 'MODERATOR',
  invitedAt: '2026-09-30T12:00:00.000Z',
  joinedAt,
});

async function renderPanel(data: api.GreenRoomSession) {
  useAuthStore.setState({ user: { username: 'artist' } as AuthUser });
  vi.spyOn(api, 'fetchGreenRoomSession').mockResolvedValue({
    data,
    meta: { source: 'api' },
  });
  return act(async () => render(<GreenRoomSessionPanel />));
}

describe('GreenRoomSessionPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('links to the Green Room chat', async () => {
    await renderPanel(session());
    const link = screen.getByRole('link', { name: 'Open Green Room chat' });
    expect(link.getAttribute('href')).toBe('/u/artist/green-room');
  });

  it('opens the green room and lists who was invited', async () => {
    await renderPanel(session());
    const open = vi.spyOn(api, 'setGreenRoomSessionEnabled').mockResolvedValue({
      ok: true,
      data: session({
        enabled: true,
        invites: [invite('a', '2026-09-30T12:05:00.000Z'), invite('b', null)],
      }),
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: 'Open the green room' }),
      );
    });
    expect(open).toHaveBeenCalledWith(true);
    const rows = within(screen.getByTestId('green-room-invites')).getAllByRole(
      'listitem',
    );
    expect(rows[0]!.textContent).toContain('Joined');
    expect(rows[1]!.textContent).toContain('Not joined');
    expect(screen.getByText(/\/u\/artist\/green-room/)).toBeTruthy();
  });

  it('takes a guest off the list', async () => {
    await renderPanel(session({ enabled: true, invites: [invite('a', null)] }));
    const remove = vi
      .spyOn(api, 'removeGreenRoomInvite')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove Guest a' }));
    });
    expect(remove).toHaveBeenCalledWith('a');
    expect(screen.getByText('Nobody is invited yet.')).toBeTruthy();
  });

  it('waits for the stream before offering the switch', async () => {
    await renderPanel(session({ channelState: 'OFFLINE' }));
    expect(
      screen.getByText(
        'Start streaming to open a green room for this broadcast.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
