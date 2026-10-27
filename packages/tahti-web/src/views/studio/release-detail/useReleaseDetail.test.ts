import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioRelease } from '../../../api/studio-types';
import { useReleaseDetail } from './useReleaseDetail';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

const { fetchStudioRelease, fetchStudioSounds, patchStudioRelease } =
  vi.hoisted(() => ({
    fetchStudioRelease: vi.fn(),
    fetchStudioSounds: vi.fn(),
    patchStudioRelease: vi.fn(),
  }));

vi.mock('../../../api/studio', () => ({
  fetchStudioRelease,
  fetchStudioSounds,
  patchStudioRelease,
  fetchEditorSource: vi.fn(),
  removeReleaseArtwork: vi.fn(),
  uploadReleaseArtwork: vi.fn(),
}));

const release = (state: string): StudioRelease => ({
  id: 'r1',
  title: 'Night Drive',
  type: 'EP',
  state,
  releaseDate: '2026-10-01',
});

function clickUndo() {
  const options = toast.success.mock.calls.find(
    ([message]) => message === 'Published.',
  )?.[1] as { action: { label: string; onClick: () => void } };
  expect(options.action.label).toBe('Undo');
  options.action.onClick();
}

describe('useReleaseDetail publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchStudioRelease.mockResolvedValue({ ok: true, data: release('DRAFT') });
    fetchStudioSounds.mockResolvedValue({ data: [] });
  });

  it('publishes and offers Undo, which puts the release back to draft', async () => {
    patchStudioRelease
      .mockResolvedValueOnce({ ok: true, data: release('PUBLISHED') })
      .mockResolvedValueOnce({ ok: true, data: release('DRAFT') });
    const { result } = renderHook(() => useReleaseDetail('r1'));
    await waitFor(() => expect(result.current.release?.state).toBe('DRAFT'));

    await act(() => result.current.publish());
    expect(patchStudioRelease).toHaveBeenCalledWith('r1', {
      state: 'PUBLISHED',
    });
    expect(result.current.release?.state).toBe('PUBLISHED');

    act(() => clickUndo());

    await waitFor(() => expect(result.current.release?.state).toBe('DRAFT'));
    expect(patchStudioRelease).toHaveBeenLastCalledWith('r1', {
      state: 'DRAFT',
    });
    expect(toast.success).toHaveBeenLastCalledWith('Back to draft.');
  });

  it('keeps the release published when the API refuses the undo', async () => {
    patchStudioRelease
      .mockResolvedValueOnce({ ok: true, data: release('PUBLISHED') })
      .mockResolvedValueOnce({ ok: false, error: 'Release not found' });
    const { result } = renderHook(() => useReleaseDetail('r1'));
    await waitFor(() => expect(result.current.release?.state).toBe('DRAFT'));

    await act(() => result.current.publish());
    act(() => clickUndo());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Release not found'),
    );
    expect(result.current.release?.state).toBe('PUBLISHED');
  });
});
