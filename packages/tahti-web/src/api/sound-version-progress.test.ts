import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeToVersionProgress } from './sound-version-progress';

class FakeEventSource {
  static last: FakeEventSource | null = null;
  onmessage: ((message: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(
    readonly url: string,
    readonly init: { withCredentials: boolean },
  ) {
    FakeEventSource.last = this;
  }
  close() {
    this.closed = true;
  }
}

describe('subscribeToVersionProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('streams progress and stops when the render is done', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const seen: number[] = [];
    subscribeToVersionProgress('s1', 'v2', (progress) =>
      seen.push(progress.pct),
    );
    const source = FakeEventSource.last!;
    expect(source.url).toBe('/tahti-api/api/me/sound/s1/versions/v2/progress');
    expect(source.init.withCredentials).toBe(true);
    source.onmessage!({
      data: JSON.stringify({ status: 'PROCESSING', pct: 0.5 }),
    });
    source.onmessage!({ data: 'not json' });
    expect(source.closed).toBe(false);
    source.onmessage!({ data: JSON.stringify({ status: 'READY', pct: 1 }) });
    expect(seen).toEqual([0.5, 1]);
    expect(source.closed).toBe(true);
  });
});
