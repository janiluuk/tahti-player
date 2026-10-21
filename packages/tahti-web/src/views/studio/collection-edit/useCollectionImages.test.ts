// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/image-from-url';
import type { StudioCollection } from '../../../api/studio-types';
import { useCollectionImages } from './useCollectionImages';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('useCollectionImages coverFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves the fetched cover and closes the upload dialog', async () => {
    vi.spyOn(api, 'setCollectionCoverFromUrl').mockResolvedValue({
      ok: true,
      url: 'https://cdn/c.jpg',
    });
    const setCol = vi.fn();
    const { result } = renderHook(() =>
      useCollectionImages('late-night', setCol),
    );
    act(() => result.current.setUploadTarget('cover'));
    let saved = false;
    await act(async () => {
      saved = await result.current.coverFromUrl('https://example.com/c.jpg');
    });
    expect(saved).toBe(true);
    expect(api.setCollectionCoverFromUrl).toHaveBeenCalledWith(
      'late-night',
      'https://example.com/c.jpg',
    );
    expect(result.current.coverUrl).toBe('https://cdn/c.jpg');
    expect(result.current.uploadTarget).toBeNull();
    const update = setCol.mock.calls[0]![0] as (
      current: StudioCollection | null,
    ) => StudioCollection | null;
    expect(update({ slug: 'late-night' } as StudioCollection)?.coverUrl).toBe(
      'https://cdn/c.jpg',
    );
  });

  it('keeps the dialog open when the image is refused', async () => {
    vi.spyOn(api, 'setCollectionCoverFromUrl').mockResolvedValue({
      ok: false,
      error: 'Not an image',
    });
    const { result } = renderHook(() =>
      useCollectionImages('late-night', vi.fn()),
    );
    act(() => result.current.setUploadTarget('cover'));
    let saved = true;
    await act(async () => {
      saved = await result.current.coverFromUrl('https://example.com/page');
    });
    expect(saved).toBe(false);
    expect(result.current.uploadTarget).toBe('cover');
  });
});
