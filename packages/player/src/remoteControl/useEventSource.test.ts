import { act, renderHook } from '@testing-library/react';

import { MockEventSource } from '../test/mocks/eventSource';
import { useEventSource } from './useEventSource';

describe('useEventSource', () => {
  let created: MockEventSource[];

  beforeEach(() => {
    vi.useFakeTimers();
    created = [];
    vi.stubGlobal(
      'EventSource',
      class extends MockEventSource {
        constructor(url: string) {
          super(url);
          created.push(this);
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('schedules one reconnect however many errors a closed source reports', () => {
    const { result } = renderHook(() => useEventSource('/api/events'));
    act(() => {
      created[0].simulateError();
      created[0].simulateError();
      created[0].simulateError();
    });
    expect(result.current[1]).toBe('reconnecting');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(created).toHaveLength(2);
  });

  it('gives up after the retry limit, counting reconnect attempts', () => {
    const { result } = renderHook(() => useEventSource('/api/events'));
    for (let attempt = 0; attempt <= 3; attempt++) {
      act(() => {
        created[created.length - 1].simulateError();
        vi.advanceTimersByTime(3000);
      });
    }
    expect(result.current[1]).toBe('failed');
    expect(created).toHaveLength(4);
  });

  it('never reconnects after unmount', () => {
    const { unmount } = renderHook(() => useEventSource('/api/events'));
    act(() => {
      created[0].simulateError();
      created[0].simulateError();
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(created).toHaveLength(1);
  });
});
