// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setBackdropFrameVerdict } from '../../lib/backdropMotion';
import { EventBannerBackdrop } from './EventBannerBackdrop';

const webgl = vi.hoisted(() => ({ software: false }));
vi.mock('../../lib/webgl', () => ({
  hasSoftwareWebGL: () => webgl.software,
}));

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
  act(() => setBackdropFrameVerdict('pending'));
  vi.unstubAllGlobals();
  webgl.software = false;
});

const backdrop = () => screen.getByTestId('event-banner-backdrop');

describe('EventBannerBackdrop', () => {
  it('drifts on a GPU', () => {
    mockReducedMotion(false);
    render(<EventBannerBackdrop src="/banner.jpg" seed="evt-1" />);
    expect(backdrop()).not.toHaveAttribute('data-still');
    expect(
      backdrop().querySelector('.tahti-event-backdrop-drift'),
    ).not.toBeNull();
  });

  it('holds still under reduced motion', () => {
    mockReducedMotion(true);
    render(<EventBannerBackdrop src="/banner.jpg" seed="evt-1" />);
    expect(backdrop()).toHaveAttribute('data-still', 'true');
  });

  it('holds still without a GPU', () => {
    mockReducedMotion(false);
    webgl.software = true;
    render(<EventBannerBackdrop src="/banner.jpg" seed="evt-1" />);
    expect(backdrop()).toHaveAttribute('data-still', 'true');
  });

  it('stops drifting once the frame monitor sees frames drop', () => {
    mockReducedMotion(false);
    render(<EventBannerBackdrop src="/banner.jpg" seed="evt-1" />);
    act(() => setBackdropFrameVerdict('slow'));
    expect(backdrop()).toHaveAttribute('data-still', 'true');
  });
});
