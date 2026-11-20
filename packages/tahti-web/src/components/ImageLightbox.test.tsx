import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ImageLightbox,
  WHEEL_STEP_MS,
  type LightboxImage,
} from './ImageLightbox';

const images: LightboxImage[] = [
  { imageUrl: 'https://img.example/1.jpg', caption: 'Doors open' },
  { imageUrl: 'https://img.example/2.jpg', title: 'Titled only' },
  { imageUrl: 'https://img.example/3.jpg', caption: 'Encore' },
];

function Controlled({
  onClose = () => {},
  start = 0,
}: {
  onClose?: () => void;
  start?: number;
}) {
  const [index, setIndex] = useState(start);
  return (
    <ImageLightbox
      images={images}
      index={index}
      label="Slideshow"
      onIndexChange={setIndex}
      onClose={onClose}
    />
  );
}

function panel() {
  return screen.getByTestId('image-lightbox');
}

function caption() {
  return document.querySelector('figcaption')?.textContent ?? '';
}

describe('ImageLightbox', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the caption, the title as a fallback and the counter', () => {
    render(<Controlled />);
    expect(caption()).toContain('Doors open');
    expect(caption()).toContain('1 / 3');
    expect(screen.getByAltText('Doors open')).toBeTruthy();
    fireEvent.keyDown(panel(), { key: 'ArrowRight' });
    expect(caption()).toContain('Titled only');
    expect(caption()).toContain('2 / 3');
  });

  it('moves with arrows, PageUp/PageDown and Home/End, wrapping around', () => {
    render(<Controlled />);
    fireEvent.keyDown(panel(), { key: 'PageDown' });
    expect(caption()).toContain('2 / 3');
    fireEvent.keyDown(panel(), { key: 'PageUp' });
    expect(caption()).toContain('1 / 3');
    fireEvent.keyDown(panel(), { key: 'ArrowLeft' });
    expect(caption()).toContain('3 / 3');
    fireEvent.keyDown(panel(), { key: 'Home' });
    expect(caption()).toContain('1 / 3');
    fireEvent.keyDown(panel(), { key: 'End' });
    expect(caption()).toContain('3 / 3');
  });

  it('moves with the previous / next buttons', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(caption()).toContain('2 / 3');
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(caption()).toContain('1 / 3');
  });

  it('closes on Escape and from the close button', () => {
    const onClose = vi.fn();
    render(<Controlled onClose={onClose} />);
    fireEvent.keyDown(panel(), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close image viewer' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('moves one image per wheel flick, at most once per step window', () => {
    let now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    render(<Controlled />);

    act(() => {
      for (let i = 0; i < 8; i += 1) {
        fireEvent.wheel(panel(), { deltaY: 60 });
        now += 16;
      }
    });
    expect(caption()).toContain('2 / 3');

    now += WHEEL_STEP_MS;
    act(() => {
      fireEvent.wheel(panel(), { deltaY: -80 });
    });
    expect(caption()).toContain('1 / 3');
  });

  it('adds small trackpad deltas up before stepping and reads deltaX', () => {
    let now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    render(<Controlled />);

    act(() => {
      fireEvent.wheel(panel(), { deltaX: 12 });
      now += 16;
      fireEvent.wheel(panel(), { deltaX: 12 });
    });
    expect(caption()).toContain('1 / 3');
    act(() => {
      now += 16;
      fireEvent.wheel(panel(), { deltaX: 12 });
    });
    expect(caption()).toContain('2 / 3');
  });

  it('moves on a horizontal swipe', () => {
    render(<Controlled />);
    fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 0 }] });
    fireEvent.touchEnd(panel(), {
      changedTouches: [{ clientX: 100, clientY: 10 }],
    });
    expect(caption()).toContain('2 / 3');
    fireEvent.touchStart(panel(), { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchEnd(panel(), {
      changedTouches: [{ clientX: 300, clientY: 0 }],
    });
    expect(caption()).toContain('1 / 3');
  });

  it('shows a single image without navigation or a counter', () => {
    render(
      <ImageLightbox
        images={[{ imageUrl: 'https://img.example/a.jpg' }]}
        index={0}
        label="Profile picture"
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull();
    expect(caption()).not.toContain('/');
  });

  it('shows the empty state when there is no image at the index', () => {
    render(
      <ImageLightbox images={[]} index={0} label="Photos" onClose={() => {}} />,
    );
    expect(screen.getByText('No photos to show')).toBeTruthy();
  });
});
