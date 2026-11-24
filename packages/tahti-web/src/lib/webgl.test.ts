import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  hasSoftwareWebGL,
  resetWebGLProbeForTests,
  supportsWebGL,
} from './webgl';

function fakeContext(renderer: string) {
  const loseContext = vi.fn();
  return {
    context: {
      RENDERER: 0x1f01,
      getParameter: (name: number) => (name === 0x1f01 ? renderer : null),
      getExtension: (name: string) =>
        name === 'WEBGL_lose_context' ? { loseContext } : null,
    },
    loseContext,
  };
}

describe('webgl probe', () => {
  afterEach(() => {
    resetWebGLProbeForTests();
    vi.restoreAllMocks();
  });

  it('reports no WebGL when no context can be created', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(supportsWebGL()).toBe(false);
    expect(hasSoftwareWebGL()).toBe(false);
  });

  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
    'llvmpipe (LLVM 17.0.6, 256 bits)',
    'Microsoft Basic Render Driver',
  ])('detects the software renderer %s', (renderer) => {
    const { context } = fakeContext(renderer);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as RenderingContext,
    );
    expect(supportsWebGL()).toBe(true);
    expect(hasSoftwareWebGL()).toBe(true);
  });

  it('probes once and releases the probe context', () => {
    const { context, loseContext } = fakeContext('ANGLE (Apple, M2, OpenGL)');
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as RenderingContext);
    expect(hasSoftwareWebGL()).toBe(false);
    expect(supportsWebGL()).toBe(true);
    expect(supportsWebGL()).toBe(true);
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });
});
