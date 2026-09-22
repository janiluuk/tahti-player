// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChannelData } from './useChannelData';

describe('useChannelData', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  it('refetches in the background without showing the loading state', async () => {
    const { result, rerender } = renderHook(
      ({ key }) => useChannelData('tahti-radio', key),
      { initialProps: { key: 0 } },
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.channel).not.toBeNull();

    await act(async () => {
      rerender({ key: 1 });
      // Let the background refetch settle inside act().
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.channel).not.toBeNull();
  });
});
