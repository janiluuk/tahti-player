import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '@tahti-player/tailwind-config';

import { PlayerBarSeekBar } from './PlayerBarSeekBar';

if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventPolyfill as typeof PointerEvent;
}

describe('PlayerBarSeekBar', () => {
  it('(Snapshot) default render', () => {
    const { asFragment } = render(
      <PlayerBarSeekBar
        progress={25}
        elapsedSeconds={97}
        remainingSeconds={1297}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('calls onSeek with percent based on click position', () => {
    const onSeek = vi.fn();
    render(
      <div style={{ width: 200 }}>
        <PlayerBarSeekBar
          progress={0}
          elapsedSeconds={0}
          remainingSeconds={0}
          onSeek={onSeek}
        />
      </div>,
    );
    const container = document.querySelector('[aria-disabled]') as HTMLElement;
    const rect = {
      left: 0,
      width: 200,
      top: 0,
      height: 8,
      right: 200,
      bottom: 8,
    };
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      rect as DOMRect,
    );
    fireEvent.click(container, { clientX: 50 });
    expect(onSeek).toHaveBeenCalledWith(25);
    fireEvent.click(container, { clientX: 200 });
    expect(onSeek).toHaveBeenCalledWith(100);
  });

  it('previews the drag position and seeks once on release', () => {
    const onSeek = vi.fn();
    render(
      <PlayerBarSeekBar
        progress={10}
        elapsedSeconds={10}
        remainingSeconds={90}
        onSeek={onSeek}
      />,
    );
    const bar = document.querySelector('[role="slider"]') as HTMLElement;
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      height: 20,
      right: 200,
      bottom: 20,
    } as DOMRect);
    const thumb = document.querySelector(
      '[data-testid="player-seek-thumb"]',
    ) as HTMLElement;
    fireEvent.pointerDown(bar, { clientX: 40, button: 0, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 120, pointerId: 1 });
    expect(thumb.style.left).toBe('60%');
    expect(onSeek).not.toHaveBeenCalled();
    fireEvent.pointerUp(bar, { clientX: 120, pointerId: 1 });
    fireEvent.click(bar, { clientX: 120 });
    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(60);
    expect(thumb.style.left).toBe('10%');
  });

  it('does not call onSeek when loading', () => {
    const onSeek = vi.fn();
    render(
      <div style={{ width: 200 }}>
        <PlayerBarSeekBar
          progress={50}
          elapsedSeconds={0}
          remainingSeconds={0}
          isLoading
          onSeek={onSeek}
        />
      </div>,
    );
    const container = document.querySelector(
      '[aria-disabled="true"]',
    ) as HTMLElement;
    const rect = {
      left: 0,
      width: 200,
      top: 0,
      height: 8,
      right: 200,
      bottom: 8,
    };
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      rect as DOMRect,
    );
    fireEvent.click(container, { clientX: 100 });
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('puts labelClassName on both time labels', () => {
    const { getByTestId } = render(
      <PlayerBarSeekBar
        progress={10}
        elapsedSeconds={5}
        remainingSeconds={45}
        labelClassName="bg-background/55"
      />,
    );
    expect(getByTestId('player-seek-elapsed').className).toContain(
      'bg-background/55',
    );
    expect(getByTestId('player-seek-remaining').className).toContain(
      'bg-background/55',
    );
  });
});
