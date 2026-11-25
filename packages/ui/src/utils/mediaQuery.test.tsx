import { act, render, renderHook, screen } from '@testing-library/react';

import { getMediaQueryMatches, useMediaQuery } from './mediaQuery';

const QUERY = '(pointer: coarse)';

function fakeList(initial: boolean) {
  const target = new EventTarget();
  const list = Object.assign(target, {
    matches: initial,
    media: QUERY,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  }) as unknown as MediaQueryList & { matches: boolean };
  const change = (matches: boolean) => {
    list.matches = matches;
    target.dispatchEvent(new Event('change'));
  };
  return { list, change };
}

describe('useMediaQuery', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it('shares one MediaQueryList across components and rerenders', () => {
    const { list } = fakeList(true);
    const matchMedia = vi.fn(() => list);
    window.matchMedia = matchMedia;
    const Probe = ({ id }: { id: string }) => (
      <span data-testid={id}>{String(useMediaQuery(QUERY))}</span>
    );
    const { rerender } = render(
      <>
        <Probe id="a" />
        <Probe id="b" />
      </>,
    );
    const callsAfterMount = matchMedia.mock.calls.length;
    for (let i = 0; i < 5; i++) {
      rerender(
        <>
          <Probe id="a" />
          <Probe id="b" />
        </>,
      );
    }
    expect(matchMedia.mock.calls.length).toBe(callsAfterMount);
    expect(screen.getByTestId('a')).toHaveTextContent('true');
    expect(screen.getByTestId('b')).toHaveTextContent('true');
  });

  it('updates on change events', () => {
    const { list, change } = fakeList(false);
    window.matchMedia = vi.fn(() => list);
    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(false);
    act(() => change(true));
    expect(result.current).toBe(true);
    act(() => change(false));
    expect(result.current).toBe(false);
  });

  it('follows a replaced window.matchMedia', () => {
    window.matchMedia = vi.fn(() => fakeList(false).list);
    const { result, rerender } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(false);
    const { list, change } = fakeList(true);
    window.matchMedia = vi.fn(() => list);
    rerender();
    expect(result.current).toBe(true);
    act(() => change(false));
    expect(result.current).toBe(false);
  });

  it('drops the cache after the last unmount, so a re-mocked implementation is read', () => {
    const matchMedia = vi.fn(() => fakeList(false).list);
    window.matchMedia = matchMedia;
    const first = renderHook(() => useMediaQuery(QUERY));
    expect(first.result.current).toBe(false);
    first.unmount();
    matchMedia.mockImplementation(() => fakeList(true).list);
    const second = renderHook(() => useMediaQuery(QUERY));
    expect(second.result.current).toBe(true);
  });

  it('is false when matchMedia is missing, returns undefined or throws', () => {
    // @ts-expect-error -- simulating a jsdom setup that never defines it
    delete window.matchMedia;
    expect(renderHook(() => useMediaQuery(QUERY)).result.current).toBe(false);
    window.matchMedia = (() => undefined) as unknown as typeof matchMedia;
    expect(renderHook(() => useMediaQuery(QUERY)).result.current).toBe(false);
    window.matchMedia = () => {
      throw new Error('boom');
    };
    expect(getMediaQueryMatches(QUERY)).toBe(false);
  });
});
