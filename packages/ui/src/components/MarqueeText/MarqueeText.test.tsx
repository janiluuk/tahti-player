import { render, screen } from '@testing-library/react';

import { MarqueeText } from './MarqueeText';

function mockWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
    scrollWidth,
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    clientWidth,
  );
}

function prefersReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

const TITLE = 'A Title Far Too Long For The Player Bar';

describe('MarqueeText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays a plain truncated line when the text fits', () => {
    prefersReducedMotion(false);
    mockWidths(100, 200);
    render(<MarqueeText data-testid="marquee">{TITLE}</MarqueeText>);
    const box = screen.getByTestId('marquee');
    expect(box).toHaveAttribute('data-marquee', 'fits');
    expect(screen.getAllByText(TITLE)).toHaveLength(1);
    expect(box.querySelector('.tahti-marquee-track')).toBeNull();
    expect(screen.getByText(TITLE)).toHaveClass('truncate');
  });

  it('scrolls two copies when the text overflows, hiding the copy from assistive tech', () => {
    prefersReducedMotion(false);
    mockWidths(480, 200);
    render(<MarqueeText data-testid="marquee">{TITLE}</MarqueeText>);
    const box = screen.getByTestId('marquee');
    expect(box).toHaveAttribute('data-marquee', 'scrolling');
    const track = box.querySelector<HTMLElement>('.tahti-marquee-track');
    expect(track).not.toBeNull();
    expect(track!.style.getPropertyValue('--tahti-marquee-duration')).toBe(
      '16.25s',
    );
    const copies = screen.getAllByText(TITLE);
    expect(copies).toHaveLength(2);
    expect(copies[1]).toHaveAttribute('aria-hidden', 'true');
    expect(copies[0].closest('[aria-hidden]')).toBeNull();
  });

  it('keeps short overflows on the minimum duration', () => {
    prefersReducedMotion(false);
    mockWidths(210, 200);
    render(<MarqueeText data-testid="marquee">{TITLE}</MarqueeText>);
    const track = screen
      .getByTestId('marquee')
      .querySelector<HTMLElement>('.tahti-marquee-track');
    expect(track!.style.getPropertyValue('--tahti-marquee-duration')).toBe(
      '7.81s',
    );
  });

  it('shows the static truncated line under reduced motion', () => {
    prefersReducedMotion(true);
    mockWidths(480, 200);
    render(<MarqueeText data-testid="marquee">{TITLE}</MarqueeText>);
    const box = screen.getByTestId('marquee');
    expect(box).toHaveAttribute('data-marquee', 'static');
    expect(box.querySelector('.tahti-marquee-track')).toBeNull();
    expect(screen.getAllByText(TITLE)).toHaveLength(1);
    expect(screen.getByText(TITLE)).toHaveClass('truncate');
  });
});
