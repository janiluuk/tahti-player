import { fireEvent, render, screen } from '@testing-library/react';

import {
  MEDIA_ROW_GROUP,
  MediaArtwork,
  MediaArtworkDefaultProvider,
} from './MediaArtwork';

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

  it('keeps the pause control at rest while playing unless hideActivePlay', () => {
    const { rerender } = render(
      <MediaArtwork size="md" onPlay={vi.fn()} isPlaying />,
    );
    expect(screen.getByTestId('media-artwork-play').className).not.toMatch(
      /group-hover\/media:opacity-100/,
    );

    rerender(
      <MediaArtwork size="md" onPlay={vi.fn()} isPlaying hideActivePlay />,
    );
    expect(screen.getByTestId('media-artwork-play').className).toMatch(
      /group-hover\/media:opacity-100/,
    );
  });

  it('on touch, shows play / pause only on the current item', () => {
    const touchVisible = /(^|\s)opacity-100(\s|$)/;
    const { rerender } = render(<MediaArtwork size="md" onPlay={vi.fn()} />);
    const idle = screen.getByTestId('media-artwork-play');
    expect(idle.className).toMatch(/(^|\s)opacity-0(\s|$)/);
    expect(idle.className).not.toMatch(touchVisible);
    expect(idle).not.toHaveAttribute('data-current');

    rerender(<MediaArtwork size="md" onPlay={vi.fn()} isCurrent />);
    const paused = screen.getByTestId('media-artwork-play');
    expect(paused.className).toMatch(touchVisible);
    expect(paused.className).toMatch(/group-hover\/media:opacity-100/);
    expect(paused).toHaveAttribute('data-current', 'true');

    rerender(<MediaArtwork size="md" onPlay={vi.fn()} isPlaying />);
    expect(screen.getByTestId('media-artwork-play')).toHaveAttribute(
      'data-current',
      'true',
    );
  });

  it('dims idle artwork on touch only for the current item', () => {
    const { container, rerender } = render(
      <MediaArtwork size="sm" onPlay={vi.fn()} />,
    );
    const dim = () =>
      container.querySelector('div[aria-hidden="true"]')?.className ?? '';
    expect(dim()).not.toMatch(/hover:none/);
    rerender(<MediaArtwork size="sm" onPlay={vi.fn()} isCurrent />);
    expect(dim()).toMatch(/hover:none/);
  });

  it('still plays an idle item from a tap on its hidden control', () => {
    const onPlay = vi.fn();
    render(<MediaArtwork size="thumb" onPlay={onPlay} />);
    fireEvent.click(screen.getByTestId('media-artwork-play'));
    expect(onPlay).toHaveBeenCalledTimes(1);
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

  it('reveals only from its own hover or a named media row, never a bare group', () => {
    const { container } = render(
      <MediaArtwork size="md" onPlay={vi.fn()} onFavorite={vi.fn()} />,
    );
    const root = screen.getByTestId('media-artwork');
    expect(root.className).toMatch(/(^|\s)group\/media(\s|$)/);
    expect(root.className).not.toMatch(/(^|\s)group(\s|$)/);

    const play = screen.getByTestId('media-artwork-play');
    const dim =
      container.querySelector('div[aria-hidden="true"]')?.className ?? '';
    for (const className of [play.className, dim]) {
      expect(className).toMatch(/group-hover\/media:/);
      expect(className).toMatch(/group-hover\/media-row:/);
      expect(className).toMatch(/group-focus-within\/media-row:/);
      expect(className).not.toMatch(/group-hover:/);
      expect(className).not.toMatch(/group-focus-within:/);
    }
    expect(MEDIA_ROW_GROUP).toBe('group/media-row');
  });

  it('keeps Shift+click queueing without the corner queue button when queueOverlay is off', () => {
    const onPlay = vi.fn();
    const onQueue = vi.fn();
    render(
      <MediaArtwork
        size="fill"
        onPlay={onPlay}
        onQueue={onQueue}
        queueOverlay={false}
      />,
    );
    expect(screen.queryByTestId('media-artwork-queue')).toBeNull();
    fireEvent.click(screen.getByTestId('media-artwork-play'), {
      shiftKey: true,
    });
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onPlay).not.toHaveBeenCalled();
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

describe('MediaArtwork alt text', () => {
  it('treats artwork without alt as decorative when it fades in', () => {
    const { container } = render(
      <MediaArtwork src="https://media.example/a.jpg" size="lg" />,
    );
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img).toHaveAttribute('alt', '');
    }
  });
});

describe('MediaArtwork default artwork', () => {
  const defaultSrc = (seed: string) => `/default/${seed}.webp`;

  it('shows the default artwork instead of an empty thumbnail', () => {
    const { container } = render(
      <MediaArtworkDefaultProvider value={defaultSrc}>
        <MediaArtwork seed="track-1" imageReveal={false} size="md" />
      </MediaArtworkDefaultProvider>,
    );
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/default/track-1.webp',
    );
    expect(screen.queryByTestId('media-artwork-fallback')).toBeNull();
  });

  it('swaps a cover that fails to load for the default artwork', () => {
    const { container } = render(
      <MediaArtworkDefaultProvider value={defaultSrc}>
        <MediaArtwork
          src="https://media.example/broken.jpg"
          alt="Night Drive"
          imageReveal={false}
          size="md"
        />
      </MediaArtworkDefaultProvider>,
    );
    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/default/Night Drive.webp',
    );
  });

  it('keeps an explicit placeholder as the empty state', () => {
    render(
      <MediaArtworkDefaultProvider value={defaultSrc}>
        <MediaArtwork placeholder={<span>logo</span>} size="md" />
      </MediaArtworkDefaultProvider>,
    );
    expect(screen.getByTestId('media-artwork-fallback')).toHaveTextContent(
      'logo',
    );
  });
});
