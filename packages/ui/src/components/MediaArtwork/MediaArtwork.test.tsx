import { fireEvent, render, screen } from '@testing-library/react';

import { MediaArtwork } from './MediaArtwork';

describe('MediaArtwork play / queue', () => {
  it('uses a neutral text overlay on thumb and sm play controls', () => {
    const { rerender } = render(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        size="thumb"
        onPlay={vi.fn()}
      />,
    );
    let play = screen.getByTestId('media-artwork-play');
    expect(play.className).toMatch(/text-white/);
    expect(play.className).not.toMatch(/bg-primary/);

    rerender(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        size="sm"
        onPlay={vi.fn()}
      />,
    );
    play = screen.getByTestId('media-artwork-play');
    expect(play.className).toMatch(/text-white/);
    expect(play.className).not.toMatch(/bg-primary/);
  });

  it('plays on click and queues on Shift+click when onQueue is set', () => {
    const onPlay = vi.fn();
    const onQueue = vi.fn();
    render(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        size="md"
        onPlay={onPlay}
        onQueue={onQueue}
      />,
    );
    const play = screen.getByTestId('media-artwork-play');
    fireEvent.click(play);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onQueue).not.toHaveBeenCalled();

    fireEvent.click(play, { shiftKey: true });
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('still plays on Shift+click when there is no onQueue', () => {
    const onPlay = vi.fn();
    render(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        size="md"
        onPlay={onPlay}
      />,
    );
    fireEvent.click(screen.getByTestId('media-artwork-play'), {
      shiftKey: true,
    });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('swaps the play icon for the queue icon while Shift is held', () => {
    render(
      <MediaArtwork
        src="https://media.example/a.jpg"
        imageReveal={false}
        size="md"
        onPlay={vi.fn()}
        onQueue={vi.fn()}
        queueLabel="Add to queue"
      />,
    );
    const play = screen.getByTestId('media-artwork-play');
    expect(play).toHaveAttribute('aria-label', 'Play · Shift+click to queue');

    fireEvent.keyDown(window, { key: 'Shift', shiftKey: true });
    expect(play).toHaveAttribute('aria-label', 'Add to queue');
    expect(play.querySelector('svg.lucide-list-plus')).not.toBeNull();

    fireEvent.keyUp(window, { key: 'Shift', shiftKey: false });
    expect(play).toHaveAttribute('aria-label', 'Play · Shift+click to queue');
    expect(play.querySelector('svg.lucide-play')).not.toBeNull();
  });
});

describe('MediaArtwork fallback', () => {
  it('letterboxes with fit="contain" and crops by default', () => {
    const { container, rerender } = render(
      <MediaArtwork src="/logo.png" alt="Station logo" imageReveal={false} />,
    );
    expect(container.querySelector('img')).toHaveClass('object-cover');
    rerender(
      <MediaArtwork
        src="/logo.png"
        alt="Station logo"
        imageReveal={false}
        fit="contain"
      />,
    );
    expect(container.querySelector('img')).toHaveClass('object-contain');
    expect(container.querySelector('img')).not.toHaveClass('object-cover');
  });

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
