import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { WaveformCanvas } from './WaveformCanvas';

// jsdom has no PointerEvent; without it fireEvent drops clientX/pointerId.
if (!('PointerEvent' in globalThis)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  vi.stubGlobal('PointerEvent', PointerEventPolyfill);
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  if (!('ResizeObserver' in globalThis)) {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  }
});

function stubRect(el: Element, width = 100) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width,
    height: 50,
    right: width,
    bottom: 50,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

const base = {
  peaks: [10, 200, 40],
  durationSec: 100,
  currentTime: 20,
  cuts: [],
  selection: null,
};

describe('WaveformCanvas', () => {
  it('seeks with the arrow keys and reports time value text', () => {
    const onSeek = vi.fn();
    render(<WaveformCanvas {...base} onSeek={onSeek} label="Tracklist" />);
    const slider = screen.getByRole('slider', { name: 'Tracklist' });
    expect(slider).toHaveAttribute('aria-valuetext', '0:20 of 1:40');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(21);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onSeek).toHaveBeenLastCalledWith(0);
  });

  it('seeks on a tap and selects on a pointer drag', () => {
    const onSeek = vi.fn();
    const onSelectRange = vi.fn();
    render(
      <WaveformCanvas
        {...base}
        onSeek={onSeek}
        onSelectRange={onSelectRange}
      />,
    );
    const slider = screen.getByRole('slider');
    stubRect(slider);
    fireEvent.pointerDown(slider, { clientX: 30, pointerId: 1 });
    expect(onSeek).toHaveBeenLastCalledWith(30);
    fireEvent.pointerMove(slider, { clientX: 60, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 60, pointerId: 1 });
    expect(onSelectRange).toHaveBeenLastCalledWith(30, 60);

    onSeek.mockClear();
    fireEvent.pointerDown(slider, { clientX: 70, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 70, pointerId: 1 });
    expect(onSeek).toHaveBeenLastCalledWith(70);
  });

  it('marks a peak-less track as empty', () => {
    render(<WaveformCanvas {...base} peaks={[]} onSeek={vi.fn()} />);
    expect(screen.getByRole('slider')).toHaveAttribute(
      'data-waveform',
      'empty',
    );
  });
});
