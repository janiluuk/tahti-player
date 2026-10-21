import { describe, expect, it } from 'vitest';

import type { JamParticipant, JamSession, JamTrack } from '../api/types';
import {
  canControlJam,
  estimatedPositionSec,
  jamPlayable,
  toggledJamState,
} from './jamPlayback';

const track: JamTrack = {
  id: 'sound:abc',
  title: 'Song',
  artistName: 'Artist',
  coverUrl: null,
  streamUrl: 'https://cdn.example.com/abc.mp3',
  protocol: 'https',
  channelSlug: 'chan',
  durationSec: 200,
};

function participant(
  userId: string,
  role: JamParticipant['role'],
  canControl: boolean,
): JamParticipant {
  return {
    userId,
    username: userId,
    displayName: userId,
    avatarUrl: null,
    role,
    canControl,
    joinedAt: '2026-10-01T00:00:00.000Z',
  };
}

function session(overrides: Partial<JamSession> = {}): JamSession {
  return {
    id: 's1',
    code: 'ABCDEF',
    hostUserId: 'host',
    collectionId: null,
    isPlaying: true,
    currentTrack: track,
    positionSec: 10,
    positionUpdatedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    endedAt: null,
    participants: [
      participant('host', 'HOST', true),
      participant('guest', 'GUEST', false),
      participant('cohost', 'GUEST', true),
    ],
    ...overrides,
  };
}

describe('canControlJam', () => {
  it('lets the host and guests given control change playback, nobody else', () => {
    const s = session();
    expect(canControlJam(s, 'host')).toBe(true);
    expect(canControlJam(s, 'cohost')).toBe(true);
    expect(canControlJam(s, 'guest')).toBe(false);
    expect(canControlJam(s, 'stranger')).toBe(false);
    expect(canControlJam(s, undefined)).toBe(false);
  });

  it('treats a participant without canControl as a listener', () => {
    const legacy = {
      ...participant('guest', 'GUEST', false),
      canControl: undefined,
    } as unknown as JamParticipant;
    expect(canControlJam(session({ participants: [legacy] }), 'guest')).toBe(
      false,
    );
  });
});

describe('estimatedPositionSec', () => {
  const start = Date.parse('2026-10-01T00:00:00.000Z');

  it('advances with the clock while playing', () => {
    expect(estimatedPositionSec(session(), start + 5000)).toBe(15);
  });

  it('stays put while paused', () => {
    expect(
      estimatedPositionSec(session({ isPlaying: false }), start + 5000),
    ).toBe(10);
  });
});

describe('jamPlayable', () => {
  it('keeps the jam track id so the local player and the session agree', () => {
    const playable = jamPlayable(track, 'https://cdn.example.com/abc.mp3');
    expect(playable).toMatchObject({
      id: 'sound:abc',
      kind: 'sound',
      title: 'Song',
      artist: 'Artist',
      streamUrl: 'https://cdn.example.com/abc.mp3',
      protocol: 'https',
    });
  });

  it('marks radio tracks as radio', () => {
    expect(jamPlayable({ ...track, id: 'radio:x' }, 'u').kind).toBe('radio');
  });
});

describe('toggledJamState', () => {
  it('pauses the current track where everyone is now', () => {
    const now = Date.parse('2026-10-01T00:00:04.000Z');
    expect(toggledJamState(session(), now)).toEqual({
      isPlaying: false,
      currentTrack: track,
      positionSec: 14,
    });
  });

  it('resumes a paused jam from where it stopped', () => {
    expect(toggledJamState(session({ isPlaying: false }))).toEqual({
      isPlaying: true,
      currentTrack: track,
      positionSec: 10,
    });
  });
});
