import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { resamplePeaks, WaveformSeekbar } from './WaveformSeekbar';

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

function stubRect(el: Element, width = 200) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width,
    height: 20,
    right: width,
    bottom: 20,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

describe('resamplePeaks', () => {
  it('keeps the loudest bucket of each bar', () => {
    expect(resamplePeaks([0, 0, 0, 255, 10, 10, 10, 10], 2)).toEqual([255, 10]);
  });
});

describe('WaveformSeekbar', () => {
  it('is a focusable, labelled slider with time value text', () => {
    render(
      <WaveformSeekbar
        trackId="t1"
        progress={0.5}
        durationSec={130}
        label="First Light"
        onSeek={vi.fn()}
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Seek First Light' });
    expect(slider).toHaveAttribute('tabindex', '0');
    expect(slider).toHaveAttribute('aria-valuetext', '1:05 of 2:10');
  });

  it('seeks from the keyboard in 5 s steps', () => {
    const onSeek = vi.fn();
    render(
      <WaveformSeekbar
        trackId="t1"
        progress={0.5}
        durationSec={100}
        onSeek={onSeek}
      />,
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(0.55);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onSeek).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(slider, { key: 'a' });
    expect(onSeek).toHaveBeenCalledTimes(2);
  });

  it('scrubs while the pointer is held and stops after release', () => {
    const onSeek = vi.fn();
    render(<WaveformSeekbar trackId="t1" progress={0} onSeek={onSeek} />);
    const slider = screen.getByRole('slider');
    stubRect(slider);
    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 150, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 10, pointerId: 1 });
    expect(onSeek.mock.calls.map(([f]) => f)).toEqual([0.25, 0.75]);
  });

  it('is not a slider when live or without onSeek', () => {
    const { rerender } = render(<WaveformSeekbar trackId="t1" progress={0} />);
    expect(screen.queryByRole('slider')).toBeNull();
    rerender(
      <WaveformSeekbar trackId="t1" progress={0} live onSeek={vi.fn()} />,
    );
    expect(screen.queryByRole('slider')).toBeNull();
  });
});
