import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AmbientBackground } from './AmbientBackground';

vi.mock('../plugins/themes', () => ({
  useThemeStore: (select: (s: { themeId: string }) => unknown) =>
    select({ themeId: 'tahti-dark' }),
}));

vi.mock('../stores/ambientStore', () => ({
  useAmbientStore: (select: (s: Record<string, unknown>) => unknown) =>
    select({
      enabled: true,
      preset: 'AURORA',
      opacity: 0.4,
      speed: 1,
      intensity: 1,
      audioReactive: false,
    }),
}));

vi.mock('./ThemeVisualizationSettings', () => ({
  isThemeVisualizationEnabled: () => true,
}));

vi.mock('./ChannelVisualizer', () => ({
  ChannelVisualizer: () => <div data-testid="channel-visualizer" />,
}));

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('AmbientBackground', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    mockReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the visualizer when the page is visible', () => {
    const { getByTestId, container } = render(<AmbientBackground />);
    expect(getByTestId('channel-visualizer')).toBeInTheDocument();
    expect(
      container.querySelector('[data-ambient-paused]'),
    ).not.toBeInTheDocument();
    const root = container.querySelector('[data-ambient-background]');
    expect(root?.className).not.toContain('mix-blend-screen');
  });

  it('pauses when prefers-reduced-motion is set', () => {
    mockReducedMotion(true);
    const { queryByTestId, container } = render(<AmbientBackground />);
    expect(queryByTestId('channel-visualizer')).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-ambient-paused]'),
    ).toBeInTheDocument();
  });

  it('pauses when reduced-motion flips on after mount', () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      get matches() {
        return matches && query === '(prefers-reduced-motion: reduce)';
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_type, listener) => {
        if (typeof listener === 'function') {
          listeners.add(listener as () => void);
        }
      }),
      removeEventListener: vi.fn((_type, listener) => {
        if (typeof listener === 'function') {
          listeners.delete(listener as () => void);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
    const { getByTestId, queryByTestId, container } = render(
      <AmbientBackground />,
    );
    expect(getByTestId('channel-visualizer')).toBeInTheDocument();
    expect(listeners.size).toBeGreaterThan(0);
    matches = true;
    act(() => {
      for (const listener of listeners) {
        listener();
      }
    });
    expect(queryByTestId('channel-visualizer')).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-ambient-paused]'),
    ).toBeInTheDocument();
  });

  it('pauses when the document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    const { queryByTestId, container } = render(<AmbientBackground />);
    expect(queryByTestId('channel-visualizer')).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-ambient-paused]'),
    ).toBeInTheDocument();
  });
});
