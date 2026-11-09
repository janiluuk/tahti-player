// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { clearSnapshots, useSnapshotFetch } from './useSnapshotFetch';

describe('useSnapshotFetch', () => {
  afterEach(() => clearSnapshots());

  it('loads once, then renders the saved snapshot at once while it refreshes', async () => {
    const first = renderHook(() =>
      useSnapshotFetch('k', () => Promise.resolve({ n: 1 })),
    );
    expect(first.result.current.loading).toBe(true);
    await waitFor(() => expect(first.result.current.data).toEqual({ n: 1 }));
    first.unmount();

    let resolve: (value: { n: number }) => void = () => undefined;
    const second = renderHook(() =>
      useSnapshotFetch(
        'k',
        () => new Promise<{ n: number }>((r) => (resolve = r)),
      ),
    );
    expect(second.result.current.data).toEqual({ n: 1 });
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.refreshing).toBe(true);
    await act(async () => resolve({ n: 2 }));
    expect(second.result.current.data).toEqual({ n: 2 });
    expect(second.result.current.refreshing).toBe(false);
  });

  it('keeps the snapshot and reports the error when a refresh fails', async () => {
    const ok = renderHook(() =>
      useSnapshotFetch('e', () => Promise.resolve('saved')),
    );
    await waitFor(() => expect(ok.result.current.data).toBe('saved'));
    ok.unmount();
    const failing = renderHook(() =>
      useSnapshotFetch<string>('e', () => Promise.reject(new Error('down'))),
    );
    await waitFor(() => expect(failing.result.current.error).toBe('down'));
    expect(failing.result.current.data).toBe('saved');
  });

  it('forgets everything on clearSnapshots', async () => {
    const ok = renderHook(() =>
      useSnapshotFetch('c', () => Promise.resolve('v')),
    );
    await waitFor(() => expect(ok.result.current.data).toBe('v'));
    ok.unmount();
    clearSnapshots();
    const next = renderHook(() =>
      useSnapshotFetch('c', () => new Promise<string>(() => undefined)),
    );
    expect(next.result.current.data).toBeNull();
    expect(next.result.current.loading).toBe(true);
  });
});
