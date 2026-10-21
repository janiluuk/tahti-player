import { cleanup, render } from '@testing-library/react';
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
  });

  it('pauses when prefers-reduced-motion is set', () => {
    mockReducedMotion(true);
    const { queryByTestId, container } = render(<AmbientBackground />);
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
