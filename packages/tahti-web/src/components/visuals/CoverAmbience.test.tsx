// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CoverAmbience } from './CoverAmbience';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CoverAmbience', () => {
  it('glows from the blurred cover when the visualizer is off', () => {
    mockReducedMotion(false);
    const { container } = render(
      <CoverAmbience
        coverUrl="/cover.jpg"
        rgb={[200, 40, 90]}
        variant="glow"
      />,
    );
    expect(screen.getByTestId('cover-ambience')).toHaveAttribute(
      'data-variant',
      'glow',
    );
    expect(container.innerHTML).toContain('url(&quot;/cover.jpg&quot;)');
    expect(container.innerHTML).toContain('rgba(200, 40, 90');
  });

  it('builds a landscape over a rippling reflection of the cover', () => {
    mockReducedMotion(false);
    const { container } = render(
      <CoverAmbience coverUrl="/cover.jpg" variant="water" />,
    );
    const water = screen.getByTestId('cover-ambience-water');
    expect(water.className).toContain('-scale-y-100');
    expect(water.style.filter).toMatch(/^url\(#cover-ripple-/);
    expect(container.querySelector('feDisplacementMap')).not.toBeNull();
    expect(container.querySelector('animate')).not.toBeNull();
  });

  it('keeps the water still under reduced motion', () => {
    mockReducedMotion(true);
    const { container } = render(
      <CoverAmbience coverUrl="/cover.jpg" variant="water" />,
    );
    expect(container.querySelector('animate')).toBeNull();
  });
});
