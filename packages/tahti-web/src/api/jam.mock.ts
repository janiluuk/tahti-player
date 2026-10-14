import { getMockSessionUser } from './mock-session';
import type { JamParticipant, JamSession, JamTrack } from './types';

const MOCK_JAM_TRACK: JamTrack = {
  id: 'mock-jam-track-1',
  title: 'Aurora Drift',
  artistName: 'Northern Lights',
  coverUrl: null,
  streamUrl: null,
  protocol: null,
  channelSlug: 'northern-lights',
  durationSec: 245,
};

const MOCK_JAM_HOST: JamParticipant = {
  userId: 'mock-jam-host',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  avatarUrl: null,
  role: 'HOST',
  canControl: true,
  joinedAt: '2026-10-14T08:00:00.000Z',
};

const sessions = new Map<string, JamSession>();

function sessionUserParticipant(role: JamParticipant['role']): JamParticipant {
  const user = getMockSessionUser();
  return {
    userId: user?.id ?? 'mock-1',
    username: user?.username ?? 'demo',
    displayName: user?.displayName ?? 'Demo Artist',
    avatarUrl: null,
    role,
    canControl: role === 'HOST',
    joinedAt: new Date().toISOString(),
  };
}

function store(session: JamSession): JamSession {
  sessions.set(session.id, session);
  sessions.set(session.code, session);
  return session;
}

function baseSession(code: string, host: JamParticipant): JamSession {
  const now = new Date().toISOString();
  return {
    id: `mock-jam-${code.toLowerCase()}`,
    code,
    hostUserId: host.userId,
    collectionId: null,
    isPlaying: true,
    currentTrack: MOCK_JAM_TRACK,
    positionSec: 42,
    positionUpdatedAt: now,
    createdAt: now,
    endedAt: null,
    participants: [host],
  };
}

export function mockCreateJam(): JamSession {
  return store(baseSession('MYJAM1', sessionUserParticipant('HOST')));
}

export function mockJoinJam(code: string): JamSession {
  const existing = sessions.get(code);
  if (existing) {
    return existing;
  }
  const guest = sessionUserParticipant('GUEST');
  const session = baseSession(code, MOCK_JAM_HOST);
  return store({ ...session, participants: [MOCK_JAM_HOST, guest] });
}

export function mockFetchJam(sessionId: string): JamSession {
  return sessions.get(sessionId) ?? mockJoinJam(sessionId);
}

export function mockUpdateJam(
  sessionId: string,
  update: (session: JamSession) => JamSession,
): JamSession {
  return store(update(mockFetchJam(sessionId)));
}
