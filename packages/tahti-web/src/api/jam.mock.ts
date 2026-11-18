import { getMockSessionUser } from './mock-session';
import { isForceMock } from './mode';
import type { JamParticipant, JamSession, JamTrack } from './types';

/** Stable demo Jam code for mock mode, docs, and Storybook (`_fixtures/jam.ts`). */
export const MOCK_JAM_DEMO_CODE = 'AURORA42';

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
let mockJamEnabled = true;

export function setMockJamEnabled(enabled: boolean): void {
  mockJamEnabled = enabled;
}

export function resetMockJamSessions(): void {
  sessions.clear();
}

export function mockJamActive(): boolean {
  return isForceMock() && mockJamEnabled;
}

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
  sessions.set(session.code.toUpperCase(), session);
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

function normalizeJamCode(code: string): string {
  return code.trim().toUpperCase();
}

export function mockCreateJam(): JamSession {
  const host = sessionUserParticipant('HOST');
  return store(baseSession(MOCK_JAM_DEMO_CODE, host));
}

export function mockJoinJam(code: string): JamSession {
  const normalized = normalizeJamCode(code);
  const existing = sessions.get(code) ?? sessions.get(normalized);
  if (existing) {
    return existing;
  }
  if (normalized !== MOCK_JAM_DEMO_CODE) {
    throw new Error('Jam not found');
  }
  const guest = sessionUserParticipant('GUEST');
  const session = baseSession(MOCK_JAM_DEMO_CODE, MOCK_JAM_HOST);
  return store({ ...session, participants: [MOCK_JAM_HOST, guest] });
}

export function mockFetchJam(sessionId: string): JamSession {
  const session = sessions.get(sessionId);
  if (session) {
    return session;
  }
  return mockJoinJam(sessionId);
}

export function mockUpdateJam(
  sessionId: string,
  update: (session: JamSession) => JamSession,
): JamSession {
  return store(update(mockFetchJam(sessionId)));
}
