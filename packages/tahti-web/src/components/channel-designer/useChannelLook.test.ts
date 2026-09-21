// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChannelVisual } from '../../api/channel-design';
import { useChannelLook } from './useChannelLook';

const { toast, gate } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  gate: { release: null as null | (() => void) },
}));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../api/channel-design', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../api/channel-design')>();
  return {
    ...actual,
    // Holds the save request open so the test can edit while it is in flight.
    patchChannelVisual: async (
      ...args: Parameters<typeof actual.patchChannelVisual>
    ) => {
      await new Promise<void>((resolve) => {
        gate.release = resolve;
      });
      return actual.patchChannelVisual(...args);
    },
  };
});

const options = { layoutSlug: 'test', reloadToken: 0 };

describe('useChannelLook', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    toast.error.mockClear();
  });

  it('keeps edits made while a save is in flight, and stays dirty', async () => {
    const { result } = renderHook(() => useChannelLook(options));
    await waitFor(() => expect(result.current.visual).not.toBeNull());

    act(() => result.current.applyLocal({ headerStyle: 'SOLID' }));
    expect(result.current.dirty).toBe(true);

    let saving: Promise<void> = Promise.resolve();
    act(() => {
      saving = result.current.save();
    });
    await waitFor(() => expect(gate.release).not.toBeNull());

    act(() =>
      result.current.applyLocal({
        headerStyle: 'GRADIENT',
      } as Partial<ChannelVisual>),
    );
    await act(async () => {
      gate.release?.();
      await saving;
    });

    expect(result.current.visual?.headerStyle).toBe('GRADIENT');
    expect(result.current.dirty).toBe(true);
  });

  it('clears dirty when nothing changed during the save', async () => {
    const { result } = renderHook(() => useChannelLook(options));
    await waitFor(() => expect(result.current.visual).not.toBeNull());
    act(() => result.current.applyLocal({ headerStyle: 'SOLID' }));

    let saving: Promise<void> = Promise.resolve();
    gate.release = null;
    act(() => {
      saving = result.current.save();
    });
    await waitFor(() => expect(gate.release).not.toBeNull());
    await act(async () => {
      gate.release?.();
      await saving;
    });

    expect(result.current.dirty).toBe(false);
  });
});
