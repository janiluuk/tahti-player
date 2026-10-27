import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useImageWithFallback } from './useImageWithFallback';

class FakeImage {
  static last: FakeImage | null = null;
  onerror: (() => void) | null = null;
  src = '';
  constructor() {
    FakeImage.last = this;
  }
}

describe('useImageWithFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the primary image until it fails, then shows the fallback', () => {
    vi.stubGlobal('Image', FakeImage);
    const { result } = renderHook(() =>
      useImageWithFallback(
        'https://cdn.example/gone.png',
        '/radio-logos/ylex.png',
      ),
    );
    expect(result.current).toBe('https://cdn.example/gone.png');
    act(() => {
      FakeImage.last!.onerror!();
    });
    expect(result.current).toBe('/radio-logos/ylex.png');
  });

  it('uses the fallback when there is no primary', () => {
    const { result } = renderHook(() =>
      useImageWithFallback(null, '/logo.png'),
    );
    expect(result.current).toBe('/logo.png');
  });
});
