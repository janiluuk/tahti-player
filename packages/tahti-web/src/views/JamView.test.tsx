// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as jamApi from '../api/jam';
import type { JamParticipant, JamSession } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { JamView } from './JamView';

const hooks = vi.hoisted(() => ({
  state: {
    session: null as unknown,
    connectionStatus: 'connected',
    ended: false,
  },
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('../hooks/useJam', () => ({
  useJamState: () => hooks.state,
  useJamGuestPlayback: () => {},
}));
vi.mock('../hooks/useJamControl', () => ({
  useJamHostSync: () => {},
  useJamCoControl: () => {},
}));
vi.mock('../components/ChannelVisualizer', () => ({
  ChannelVisualizer: () => null,
}));

function participant(
  userId: string,
  role: JamParticipant['role'],
): JamParticipant {
  return {
    userId,
    username: `${userId}-handle`,
    displayName: userId,
    avatarUrl: null,
    role,
    canControl: role === 'HOST',
    joinedAt: '2026-10-01T00:00:00.000Z',
  };
}

function sessionWith(participants: JamParticipant[]): JamSession {
  return {
    id: 's1',
    code: 'ABC234',
    hostUserId: 'host',
    collectionId: null,
    isPlaying: false,
    currentTrack: null,
    positionSec: 0,
    positionUpdatedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    endedAt: null,
    participants,
  } as JamSession;
}

async function renderAs(userId: string, session: JamSession) {
  useAuthStore.setState({ user: { id: userId } as never });
  hooks.state = { session, connectionStatus: 'connected', ended: false };
  vi.spyOn(jamApi, 'joinJam').mockResolvedValue(session);
  await act(async () => {
    render(<JamView code="ABC234" />);
  });
}

describe('JamView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(cleanup);

  it('lets the host remove a guest after confirming', async () => {
    const session = sessionWith([
      participant('host', 'HOST'),
      participant('g1', 'GUEST'),
    ]);
    const remove = vi
      .spyOn(jamApi, 'removeJamParticipant')
      .mockResolvedValue(session);
    await renderAs('host', session);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove g1 from the Jam' }),
    );
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByText('Remove g1 from the Jam?')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    });

    expect(remove).toHaveBeenCalledWith('s1', 'g1');
  });

  it('gives a guest no remove buttons', async () => {
    await renderAs(
      'g1',
      sessionWith([participant('host', 'HOST'), participant('g1', 'GUEST')]),
    );
    expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
    expect(screen.getByRole('button', { name: /Leave Jam/ })).toBeTruthy();
  });

  it('tells a guest the host removed them once they are no longer in the list', async () => {
    await renderAs('g1', sessionWith([participant('host', 'HOST')]));
    expect(screen.getByText('You are no longer in this Jam')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Leave Jam/ })).toBeNull();
  });
});
