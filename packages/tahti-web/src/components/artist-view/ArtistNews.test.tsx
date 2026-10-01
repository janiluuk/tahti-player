import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchArtistNewsFeed } from '../../api/artist-news';
import { ArtistNews } from './ArtistNews';

vi.mock('../../api/artist-news', () => ({ fetchArtistNewsFeed: vi.fn() }));

async function renderNews(
  feed: Awaited<ReturnType<typeof fetchArtistNewsFeed>>['data'],
  pinned: { id: string; body: string }[] = [],
) {
  vi.mocked(fetchArtistNewsFeed).mockResolvedValue({
    data: feed,
    meta: { source: 'api' },
  });
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <ArtistNews
        news={pinned as Parameters<typeof ArtistNews>[0]['news']}
        username="selector"
      />,
    );
  });
  return result!;
}

describe('ArtistNews', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("links the artist's feed items", async () => {
    await renderNews([
      {
        title: 'New EP out on Friday',
        link: 'https://blog.example/new-ep',
        pubDate: '2026-09-28T10:00:00.000Z',
      },
    ]);
    expect(fetchArtistNewsFeed).toHaveBeenCalledWith('selector');
    expect(
      screen
        .getByRole('link', { name: /New EP out on Friday/ })
        .getAttribute('href'),
    ).toBe('https://blog.example/new-ep');
    expect(screen.getByText('News')).toBeTruthy();
  });

  it('keeps pinned announcements above the feed', async () => {
    await renderNews(
      [
        {
          title: 'Tour dates',
          link: 'https://blog.example/tour',
          pubDate: null,
        },
      ],
      [{ id: 'a1', body: 'Live on Saturday' }],
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toBe('Live on Saturday');
    expect(items[1]?.textContent).toContain('Tour dates');
  });

  it('renders nothing without news or a feed', async () => {
    const { container } = await renderNews([]);
    expect(container.innerHTML).toBe('');
  });
});
