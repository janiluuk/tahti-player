// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useHorizontalSwipe } from './useHorizontalSwipe';

function pointer(
  x: number,
  y: number,
  overrides: Partial<PointerEvent<HTMLElement>> = {},
) {
  return {
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    ...overrides,
  } as PointerEvent<HTMLElement>;
}

function setup() {
  const onPrev = vi.fn();
  const onNext = vi.fn();
  const { result } = renderHook(() => useHorizontalSwipe({ onPrev, onNext }));
  const swipe = (
    from: [number, number],
    to: [number, number],
    overrides: Partial<PointerEvent<HTMLElement>> = {},
  ) => {
    result.current.onPointerDown(pointer(...from, overrides));
    result.current.onPointerUp(pointer(...to, overrides));
  };
  return { onPrev, onNext, result, swipe };
}

describe('useHorizontalSwipe', () => {
  it('swiping left goes to the next item, right to the previous', () => {
    const { onPrev, onNext, swipe } = setup();
    swipe([200, 100], [120, 110]);
    expect(onNext).toHaveBeenCalledTimes(1);
    swipe([100, 100], [180, 90]);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('ignores moves shorter than the threshold', () => {
    const { onPrev, onNext, swipe } = setup();
    swipe([200, 100], [150, 100]);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('ignores mostly vertical moves (scrolling)', () => {
    const { onPrev, onNext, swipe } = setup();
    swipe([200, 100], [130, 220]);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('ignores mouse drags and cancelled pointers', () => {
    const { onNext, result, swipe } = setup();
    swipe([200, 100], [50, 100], { pointerType: 'mouse' });
    expect(onNext).not.toHaveBeenCalled();

    result.current.onPointerDown(pointer(200, 100));
    result.current.onPointerCancel();
    result.current.onPointerUp(pointer(50, 100));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('maps the arrow keys while the element itself has focus', () => {
    const { onPrev, onNext, result } = setup();
    const element = document.createElement('div');
    const key = (name: string, target: EventTarget = element) => {
      const preventDefault = vi.fn();
      result.current.onKeyDown({
        key: name,
        target,
        currentTarget: element,
        preventDefault,
      } as unknown as KeyboardEvent<HTMLElement>);
      return preventDefault;
    };

    expect(key('ArrowRight')).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledTimes(1);
    key('ArrowLeft');
    expect(onPrev).toHaveBeenCalledTimes(1);

    key('ArrowRight', document.createElement('input'));
    key('Enter');
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
