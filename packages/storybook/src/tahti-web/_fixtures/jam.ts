import type { JamEvent, JamSession } from '@tahti-web/api/types';

import { MOCK_USERS } from '../_lib/decorators';

export const JAM_CODE = 'AURORA42';
export const JAM_SESSION_ID = 'jam-story-1';

export const GUEST_WITH_CONTROL = 'Liina';
export const GUEST_LISTENING = 'Kaamos Fan';

export function jamSession(patch: Partial<JamSession> = {}): JamSession {
  const now = new Date().toISOString();
  return {
    id: JAM_SESSION_ID,
    code: JAM_CODE,
    hostUserId: MOCK_USERS.artist.id,
    collectionId: 'night-shift-swaps',
    isPlaying: true,
    currentTrack: {
      id: 'nl-cat-1',
      title: 'Borrowed Light',
      artistName: 'Northern Lights',
      coverUrl: null,
      streamUrl: 'https://cdn.tahti.live/nl-cat-1.mp3',
      protocol: 'https',
      channelSlug: 'northern-lights',
      durationSec: 245,
    },
    positionSec: 42,
    positionUpdatedAt: now,
    createdAt: now,
    endedAt: null,
    participants: [
      {
        userId: MOCK_USERS.artist.id,
        username: MOCK_USERS.artist.username,
        displayName: MOCK_USERS.artist.displayName,
        avatarUrl: null,
        role: 'HOST',
        canControl: true,
        joinedAt: now,
      },
      {
        userId: MOCK_USERS.listener.id,
        username: MOCK_USERS.listener.username,
        displayName: GUEST_WITH_CONTROL,
        avatarUrl: null,
        role: 'GUEST',
        canControl: false,
        joinedAt: now,
      },
      {
        userId: 'mock-guest-2',
        username: 'kaamos_fan',
        displayName: GUEST_LISTENING,
        avatarUrl: null,
        role: 'GUEST',
        canControl: true,
        joinedAt: now,
      },
    ],
    ...patch,
  };
}

type FakeJamOptions = {
  /** The join request answers 404, as for an expired or mistyped link. */
  joinFails?: boolean;
  /** The host ends the session right after the guest connects. */
  endsAfterJoin?: boolean;
};

const JAM_PATH = /\/api\/v1\/jam\/(.+)$/;

function json(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * The Jam API has no offline mock, so Jam stories stand in for it: `fetch`
 * answers the `/api/v1/jam` routes from `initial`, and `EventSource` is a
 * fake that pushes every change as the real SSE stream does. Other
 * requests pass through. Returns the cleanup for `beforeEach`.
 */
export function installFakeJam(
  initial: JamSession,
  options: FakeJamOptions = {},
): () => void {
  let session = initial;
  const streams = new Set<FakeEventSource>();
  const broadcast = (event: JamEvent) => {
    for (const stream of streams) {
      stream.push(event);
    }
  };
  const update = (next: JamSession) => {
    session = next;
    broadcast({ type: 'state', session });
    return json(session);
  };

  class FakeEventSource {
    onopen: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor() {
      streams.add(this);
      setTimeout(() => {
        this.onopen?.(new Event('open'));
        this.push({ type: 'state', session });
        if (options.endsAfterJoin) {
          setTimeout(() => this.push({ type: 'ended' }), 50);
        }
      }, 0);
    }

    push(event: JamEvent) {
      this.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(event) }),
      );
    }

    close() {
      streams.delete(this);
    }
  }

  const realFetch = window.fetch;
  const RealEventSource = window.EventSource;

  window.fetch = async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      window.location.href,
    );
    const match = JAM_PATH.exec(url.pathname);
    if (!match) {
      return realFetch(input, init);
    }
    const method = (init?.method ?? 'GET').toUpperCase();
    const parts = match[1]!.split('/').map(decodeURIComponent);

    if (parts[1] === 'join') {
      return options.joinFails
        ? json({ error: 'Jam not found' }, 404)
        : json(session);
    }
    if (parts.length === 1) {
      if (method === 'DELETE') {
        broadcast({ type: 'ended' });
        return json(null, 204);
      }
      return json(session);
    }
    if (parts[1] === 'state') {
      const body = JSON.parse(String(init?.body ?? '{}')) as Pick<
        JamSession,
        'isPlaying' | 'currentTrack' | 'positionSec'
      >;
      return update({
        ...session,
        ...body,
        positionUpdatedAt: new Date().toISOString(),
      });
    }
    if (parts[1] === 'participants' && parts[2]) {
      const userId = parts[2];
      if (method === 'DELETE') {
        return update({
          ...session,
          participants: session.participants.filter((p) => p.userId !== userId),
        });
      }
      const { canControl } = JSON.parse(String(init?.body ?? '{}')) as {
        canControl: boolean;
      };
      return update({
        ...session,
        participants: session.participants.map((p) =>
          p.userId === userId ? { ...p, canControl } : p,
        ),
      });
    }
    return json(null, 204);
  };
  window.EventSource = FakeEventSource as unknown as typeof EventSource;

  return () => {
    window.fetch = realFetch;
    window.EventSource = RealEventSource;
    streams.clear();
  };
}
