import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  autoBarCount,
  resamplePeaks,
  WaveformSeekbar,
} from './WaveformSeekbar';

// jsdom has no PointerEvent; without it fireEvent drops clientX/pointerId.
if (!('PointerEvent' in globalThis)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
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

describe('autoBarCount', () => {
  it('fits about one bar per 4 px within 16..160', () => {
    expect(autoBarCount(400)).toBe(100);
    expect(autoBarCount(20)).toBe(16);
    expect(autoBarCount(4000)).toBe(160);
    expect(autoBarCount(0)).toBe(64);
  });
});

describe('WaveformSeekbar', () => {
  it('does not render one bar per stored peak', () => {
    const peaks = Array.from({ length: 600 }, (_, i) => i % 256);
    const { container } = render(
      <WaveformSeekbar trackId="t1" progress={0} peaks={peaks} />,
    );
    const bars = container.querySelectorAll('[data-waveform] > div > span');
    expect(bars.length).toBeLessThanOrEqual(160);
    expect(bars.length).toBeGreaterThan(0);
  });

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

  it('previews the time under a hovering mouse, not a touch', () => {
    render(
      <WaveformSeekbar
        trackId="t1"
        progress={0}
        durationSec={200}
        onSeek={vi.fn()}
      />,
    );
    const slider = screen.getByRole('slider');
    stubRect(slider);
    fireEvent.pointerMove(slider, { clientX: 50, pointerType: 'touch' });
    expect(screen.queryByTestId('waveform-seekbar-hover')).toBeNull();
    fireEvent.pointerMove(slider, { clientX: 50, pointerType: 'mouse' });
    expect(screen.getByTestId('waveform-seekbar-hover')).toHaveTextContent(
      '0:50',
    );
    fireEvent.pointerLeave(slider);
    expect(screen.queryByTestId('waveform-seekbar-hover')).toBeNull();
  });
});
