import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueItem } from '@tahti-player/model';

import type { JamClient } from './jamClient';
import { JamUnpairedError } from './jamClient';
import { JamRemote } from './JamRemote';

class FakeEventSource {
  static last: FakeEventSource | null = null;
  listeners = new Map<string, ((event: Event) => void)[]>();
  constructor(public url: string) {
    FakeEventSource.last = this;
    queueMicrotask(() => this.fire('open'));
  }
  addEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  fire(type: string, data?: unknown) {
    const event = Object.assign(new Event(type), {
      data: JSON.stringify(data),
    });
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
  close() {}
}

const item = (id: string, title: string): QueueItem => ({
  id,
  status: 'success',
  addedAtIso: '2026-10-14T00:00:00Z',
  track: {
    title,
    artists: [{ name: 'Artist', roles: ['performer'] }],
    source: { provider: 'tahti', id },
  },
});

function fakeClient(overrides: Partial<JamClient> = {}): JamClient {
  return {
    eventsUrl: '/api/events?token=t',
    queue: vi.fn(async () => ({
      items: [item('a', 'First'), item('b', 'Second')],
      currentIndex: 0,
    })),
    playback: vi.fn(async () => ({
      status: 'playing' as const,
      seek: 30,
      duration: 120,
      volume: 1,
      muted: false,
    })),
    settings: vi.fn(async () => ({ shuffle: false, repeat: 'off' as const })),
    toggle: vi.fn(async () => null),
    next: vi.fn(async () => null),
    previous: vi.fn(async () => null),
    seek: vi.fn(async () => null),
    shuffle: vi.fn(async () => null),
    repeat: vi.fn(async () => null),
    playItem: vi.fn(async () => null),
    remove: vi.fn(async () => null),
    add: vi.fn(async () => null),
    search: vi.fn(async () => ({ tracks: [] })),
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal('EventSource', FakeEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('JamRemote', () => {
  it('asks an unpaired phone to scan the code', () => {
    render(<JamRemote client={null} />);
    expect(screen.getByText('This device isn’t paired')).toBeTruthy();
  });

  it('says so when the pairing code was replaced', async () => {
    const client = fakeClient({
      queue: vi.fn(async () => {
        throw new JamUnpairedError('Not paired');
      }),
    });
    render(<JamRemote client={client} />);
    expect(await screen.findByText('This device isn’t paired')).toBeTruthy();
  });

  it('shows what is playing, controls it and follows the event stream', async () => {
    const client = fakeClient();
    render(<JamRemote client={client} />);
    expect(await screen.findAllByText('First')).not.toHaveLength(0);
    expect(FakeEventSource.last?.url).toBe('/api/events?token=t');
    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(client.toggle).toHaveBeenCalledOnce();
    act(() =>
      FakeEventSource.last?.fire('queue', {
        items: [item('b', 'Second')],
        currentIndex: 0,
      }),
    );
    expect(screen.queryByText('First')).toBeNull();
  });
});
