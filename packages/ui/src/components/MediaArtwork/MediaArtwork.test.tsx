import { render, screen } from '@testing-library/react';

import { MediaArtwork } from './MediaArtwork';

describe('MediaArtwork fallback', () => {
  it('paints the fallback background when there is no image', () => {
    render(
      <MediaArtwork
        src={null}
        fallbackBackground="linear-gradient(135deg, #A78BFA, #22D3EE)"
      />,
    );
    const fallback = screen.getByTestId('media-artwork-fallback');
    expect(fallback.style.background).toContain('linear-gradient');
    expect(fallback.className).not.toContain('bg-background-secondary');
  });

  it('uses the theme surface without a fallback background', () => {
    render(<MediaArtwork src={null} />);
    const fallback = screen.getByTestId('media-artwork-fallback');
    expect(fallback.getAttribute('style')).toBeNull();
    expect(fallback.className).toContain('bg-background-secondary');
  });

  it('ignores the fallback background once an image is set', () => {
    render(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        fallbackBackground="#22D3EE"
      />,
    );
    expect(screen.queryByTestId('media-artwork-fallback')).toBeNull();
  });
});
