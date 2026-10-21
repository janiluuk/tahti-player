import { fireEvent, render, screen } from '@testing-library/react';

import { MediaArtwork } from './MediaArtwork';

const GIF = 'https://media.example/avatar.gif';
const POSTER = 'https://media.example/avatar-poster.png';

const imageSrc = () =>
  screen.getByTestId('media-artwork').querySelector('img')?.getAttribute('src');

const preferReducedMotion = (reduce: boolean) => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
};

describe('MediaArtwork animated artwork', () => {
  afterEach(() => {
    preferReducedMotion(false);
  });

  it('shows the poster at rest and the animation on hover', () => {
    preferReducedMotion(false);
    render(<MediaArtwork src={GIF} posterSrc={POSTER} />);
    expect(imageSrc()).toBe(POSTER);
    fireEvent.pointerEnter(screen.getByTestId('media-artwork'));
    expect(imageSrc()).toBe(GIF);
    fireEvent.pointerLeave(screen.getByTestId('media-artwork'));
    expect(imageSrc()).toBe(POSTER);
  });

  it('animates while a control inside it has focus', () => {
    preferReducedMotion(false);
    render(
      <MediaArtwork src={GIF} posterSrc={POSTER} size="md" onPlay={() => {}} />,
    );
    fireEvent.focus(screen.getByTestId('media-artwork-play'));
    expect(imageSrc()).toBe(GIF);
    fireEvent.blur(screen.getByTestId('media-artwork-play'));
    expect(imageSrc()).toBe(POSTER);
  });

  it('animates when a wrapping control asks it to', () => {
    preferReducedMotion(false);
    const { rerender } = render(
      <MediaArtwork src={GIF} posterSrc={POSTER} animate />,
    );
    expect(imageSrc()).toBe(GIF);
    rerender(<MediaArtwork src={GIF} posterSrc={POSTER} animate={false} />);
    expect(imageSrc()).toBe(POSTER);
  });

  it('keeps the poster when reduced motion is preferred', () => {
    preferReducedMotion(true);
    render(<MediaArtwork src={GIF} posterSrc={POSTER} animate />);
    fireEvent.pointerEnter(screen.getByTestId('media-artwork'));
    expect(imageSrc()).toBe(POSTER);
  });

  it('shows the image as-is without a poster', () => {
    render(<MediaArtwork src={GIF} imageReveal={false} />);
    expect(imageSrc()).toBe(GIF);
  });
});
