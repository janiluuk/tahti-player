import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthSession } from './AuthSession';
import { createMemoryStorage } from './storage';

type BroadcastMessage = {
  type: string;
  accessToken?: string;
  expiresAt?: number;
};

class MockBroadcastChannel {
  static readonly channels = new Map<string, Set<MockBroadcastChannel>>();
  readonly name: string;
  onmessage: ((event: MessageEvent<BroadcastMessage>) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set());
    }
    MockBroadcastChannel.channels.get(name)!.add(this);
  }

  postMessage(data: BroadcastMessage) {
    for (const peer of MockBroadcastChannel.channels.get(this.name) ?? []) {
      if (peer === this || !peer.onmessage) {
        continue;
      }
      peer.onmessage({ data } as MessageEvent<BroadcastMessage>);
    }
  }

  close() {
    MockBroadcastChannel.channels.get(this.name)?.delete(this);
  }
}

describe('AuthSession multi-tab sync', () => {
  beforeEach(() => {
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    MockBroadcastChannel.channels.clear();
  });

  it('applies token updates received from another tab', async () => {
    const storageA = createMemoryStorage(null);
    const storageB = createMemoryStorage(null);
    const sessionA = new AuthSession({
      apiBase: 'https://api.test',
      storage: storageA,
      now: () => 1_000_000,
    });
    const sessionB = new AuthSession({
      apiBase: 'https://api.test',
      storage: storageB,
      now: () => 1_000_000,
    });
    sessionA.start();
    sessionB.start();
    await sessionA.setFromLogin({
      accessToken: 'tab-a-token',
      expiresIn: 900,
      refreshToken: 'refresh-a',
    });
    expect(sessionB.getAccessToken()).toBe('tab-a-token');
    sessionA.stop();
    sessionB.stop();
  });

  it('signs out peer tabs when one tab signs out', async () => {
    const sessionA = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
      fetch: vi.fn(async () => new Response('ok', { status: 200 })),
    });
    const sessionB = new AuthSession({
      apiBase: 'https://api.test',
      storage: createMemoryStorage('r1'),
    });
    sessionA.start();
    sessionB.start();
    await sessionA.setFromLogin({
      accessToken: 'a1',
      expiresIn: 900,
      refreshToken: 'r1',
    });
    await sessionA.signOut();
    expect(sessionB.getState().status).toBe('signed-out');
    sessionA.stop();
    sessionB.stop();
  });
});
