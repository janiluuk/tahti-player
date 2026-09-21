import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../../lib/nativeLibrary';
import { useNativeImport } from './useNativeImport';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

function fakeLibrary(importResult: unknown) {
  const unsubscribe = vi.fn();
  const library = {
    import: vi.fn().mockResolvedValue(importResult),
    importPaths: vi.fn().mockResolvedValue(importResult),
    onImportProgress: vi.fn(() => () => undefined),
    onFilesDropped: vi.fn(() => unsubscribe),
    cancelImport: vi.fn(),
  };
  return {
    library: library as unknown as TahtiNativeLibrary,
    raw: library,
    unsubscribe,
  };
}

const ok = { imported: 2, skipped: 0, errors: [], cancelled: false };

describe('useNativeImport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('imports, reports, toggles loading and refreshes', async () => {
    const { library } = fakeLibrary(ok);
    const setLoading = vi.fn();
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useNativeImport(library, setLoading, refresh),
    );
    await act(() => result.current.importFiles());
    expect(toast.success).toHaveBeenCalledWith('Imported 2 tracks.');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(setLoading.mock.calls.map(([v]) => v)).toEqual([true, false]);
  });

  it('keeps the drop subscription when only the refresh callback changes', () => {
    const { library, raw } = fakeLibrary(ok);
    const setLoading = vi.fn();
    const { rerender } = renderHook(
      ({ refresh }) => useNativeImport(library, setLoading, refresh),
      { initialProps: { refresh: () => Promise.resolve() } },
    );
    rerender({ refresh: () => Promise.resolve() });
    rerender({ refresh: () => Promise.resolve() });
    expect(raw.onFilesDropped).toHaveBeenCalledTimes(1);
  });

  it('retries only the files that failed', async () => {
    const failed = {
      imported: 0,
      skipped: 0,
      errors: [{ path: '/m/bad.flac', error: 'corrupt' }],
      cancelled: false,
    };
    const { library, raw } = fakeLibrary(failed);
    const { result } = renderHook(() =>
      useNativeImport(library, vi.fn(), () => Promise.resolve()),
    );
    await act(() => result.current.importFiles());
    const retry = toast.error.mock.calls[0]?.[1]?.action?.onClick as () => void;
    await act(async () => retry());
    expect(raw.importPaths).toHaveBeenCalledWith(['/m/bad.flac']);
  });
});
