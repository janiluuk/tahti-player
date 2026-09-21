// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelBackdropCard } from './ChannelBackdropCard';

vi.mock('./ChannelSlideshowBackdrop', () => ({
  ChannelSlideshowBackdrop: ({ preset }: { preset?: string | null }) => (
    <div data-testid="slideshow" data-preset={preset ?? ''} />
  ),
}));
vi.mock('./ChannelVisualizer', () => ({
  ChannelVisualizer: ({ preset }: { preset: string }) => (
    <div data-testid="visualizer" data-preset={preset} />
  ),
}));

const base = {
  displayName: 'Artist',
  username: 'artist',
  accent: '#111111',
  highlight: '#222222',
  bg: '#333333',
  fg: '#ffffff',
  visualPreset: 'AURORA',
  navItems: [],
};

function render(props: Partial<Parameters<typeof ChannelBackdropCard>[0]>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <ChannelBackdropCard {...base} headerStyle="GRADIENT" {...props} />,
    );
  });
  return container;
}

describe('ChannelBackdropCard backdrop', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('shows the top bar text only when set', () => {
    expect(
      render({ topBarText: ' New album out ' }).querySelector(
        '[data-testid="channel-backdrop-top-bar"]',
      )?.textContent,
    ).toBe('New album out');
    document.body.replaceChildren();
    expect(
      render({ topBarText: '   ' }).querySelector(
        '[data-testid="channel-backdrop-top-bar"]',
      ),
    ).toBeNull();
  });

  it('SOLID paints the flat background colour', () => {
    const el = render({ headerStyle: 'SOLID' });
    expect(el.innerHTML).toContain('background-color: rgb(51, 51, 51)');
  });

  it('GRADIENT uses the brand gradient override when given', () => {
    const el = render({ gradientOverride: 'linear-gradient(red, blue)' });
    expect(el.innerHTML).toContain('linear-gradient(red, blue)');
  });

  it('VIDEO_LOOP plays a video URL, or shows an image URL', () => {
    const video = render({
      headerStyle: 'VIDEO_LOOP',
      videoBackgroundUrl: 'https://x.test/a.mp4',
    });
    expect(video.querySelector('video')).not.toBeNull();
    document.body.replaceChildren();
    const image = render({
      headerStyle: 'VIDEO_LOOP',
      videoBackgroundUrl: 'https://x.test/a.png',
    });
    expect(image.querySelector('video')).toBeNull();
    expect(
      image.querySelector('img[src="https://x.test/a.png"]'),
    ).not.toBeNull();
  });

  it('VIDEO_LOOP with an unusable URL falls back instead of a broken video', () => {
    const el = render({
      headerStyle: 'VIDEO_LOOP',
      videoBackgroundUrl: 'http://insecure.test/a.mp4',
    });
    expect(el.querySelector('video')).toBeNull();
  });

  // The designer's "Slideshow" header mode sets headerStyle GRADIENT plus a
  // gallery mode, so the slideshow must win over the gradient.
  it('shows the slideshow when the gallery is on, under the GRADIENT header style', () => {
    const el = render({
      headerStyle: 'GRADIENT',
      galleryMode: 'STATIC_SLIDESHOW',
      slideshowImages: ['https://x.test/1.jpg', 'https://x.test/2.jpg'],
      slideshowPreset: 'CUBE_FLIP',
    });
    expect(
      el
        .querySelector('[data-testid="slideshow"]')
        ?.getAttribute('data-preset'),
    ).toBe('CUBE_FLIP');
  });

  it('does not show a slideshow without images or with the gallery off', () => {
    expect(
      render({
        galleryMode: 'STATIC_SLIDESHOW',
        slideshowImages: [],
      }).querySelector('[data-testid="slideshow"]'),
    ).toBeNull();
    document.body.replaceChildren();
    expect(
      render({
        galleryMode: 'NONE',
        slideshowImages: ['https://x.test/1.jpg'],
      }).querySelector('[data-testid="slideshow"]'),
    ).toBeNull();
  });

  // KNOWN GAP: the WebGL gallery styles offered in the designer's "Gallery
  // style" select have no renderer anywhere; only STATIC_SLIDESHOW draws.
  it.fails.each([
    'TWISTED_WAVE_GLSL',
    'ZOOM_BLUR_GLSL',
    'RGB_SHIFT_GLSL',
    'POSTER_WALL_GLSL',
    'SHATTER_CAROUSEL_GLSL',
  ])('renders the %s gallery style', (galleryMode) => {
    const el = render({
      galleryMode,
      slideshowImages: ['https://x.test/1.jpg', 'https://x.test/2.jpg'],
    });
    expect(el.querySelector('[data-testid="slideshow"]')).not.toBeNull();
  });
});
