// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '../MediaArtwork';
import { StoryCard } from './StoryCard';

describe('StoryCard', () => {
  afterEach(cleanup);

  it('shows kind pill, date, title, excerpt and author', () => {
    render(
      <StoryCard
        imageSrc="https://example.com/a.jpg"
        kind="shared news"
        date="1 day ago"
        title="Hi, I make the flutes you hear here"
        excerpt="A short hello."
        authorName="Resonant Crafts"
      />,
    );
    expect(screen.getByText('shared news')).toBeTruthy();
    expect(screen.getByText('1 day ago')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: 'Hi, I make the flutes you hear here',
      }),
    ).toBeTruthy();
    expect(screen.getByText('A short hello.')).toBeTruthy();
    expect(screen.getByText('Resonant Crafts')).toBeTruthy();
  });

  it('renders custom media instead of the image and wraps the author', () => {
    render(
      <StoryCard
        media={<div data-testid="custom-media" />}
        kind="released a track"
        date="3 hours ago"
        title="Dawn"
        authorName="Aurora"
        renderAuthor={(row) => <a href="/u/aurora">{row}</a>}
      />,
    );
    expect(screen.getByTestId('custom-media')).toBeTruthy();
    expect(screen.getByText('released a track')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/u/aurora');
  });

  it('shows the default artwork, not the avatar or an initial, when the story has no image', () => {
    const { container } = render(
      <MediaArtworkDefaultProvider value={(seed) => `/default/${seed}.jpg`}>
        <StoryCard
          imageSrc={null}
          artworkSeed="story-1"
          meta="Story"
          title="Hello"
          authorName="Aurora"
          authorAvatarSrc="https://example.com/avatar.png"
        />
      </MediaArtworkDefaultProvider>,
    );
    expect(
      container.querySelector('img[src="/default/story-1.jpg"]'),
    ).toBeTruthy();
    expect(
      container.querySelectorAll('img[src="https://example.com/avatar.png"]'),
    ).toHaveLength(1);
  });

  it('seeds the default artwork with the author when no seed is given', () => {
    const { container } = render(
      <MediaArtworkDefaultProvider value={(seed) => `/default/${seed}.jpg`}>
        <StoryCard meta="Story" title="Hello" authorName="aurora" />
      </MediaArtworkDefaultProvider>,
    );
    expect(
      container.querySelector('img[src="/default/aurora.jpg"]'),
    ).toBeTruthy();
  });

  it('opens the story from its image when onOpen is given', () => {
    const onOpen = vi.fn();
    render(
      <StoryCard
        imageSrc="https://example.com/a.jpg"
        meta="News"
        title="Hello"
        authorName="Aurora"
        onOpen={onOpen}
        openLabel="Read Hello"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Read Hello' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

describe('StoryCard overlay', () => {
  afterEach(cleanup);

  it('overlays the date as a <time> and leaves out the author row for news', () => {
    render(
      <StoryCard
        imageSrc="https://example.com/news.jpg"
        kind="News"
        date="2 days ago"
        dateTime="2026-11-01T10:00:00.000Z"
        title="We are now open!"
      />,
    );
    const time = screen.getByText('2 days ago');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('datetime')).toBe('2026-11-01T10:00:00.000Z');
    expect(
      screen.getByRole('heading', { name: 'We are now open!' }),
    ).toBeTruthy();
  });
});
