// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NewsCarousel } from './NewsCarousel';

const ITEMS = [
  {
    id: 'a',
    title: 'House Music Pioneer Has Died',
    source: '5 Magazine',
    sourceColor: 'rgb(255, 0, 0)',
    publishedAt: '2026-10-30T10:00:00.000Z',
    publishedLabel: 'Oct 30, 2026',
    imageUrl: 'https://example.com/a.jpg',
  },
  {
    id: 'b',
    title: 'Best Of Today #Release #376',
    source: 'EDM Lab',
    publishedLabel: '5 hours ago',
  },
];

describe('NewsCarousel', () => {
  afterEach(cleanup);

  it('shows each headline with its source and date under the picture', () => {
    render(<NewsCarousel items={ITEMS} />);
    const region = screen.getByRole('region', { name: 'Latest News' });
    const cards = within(region).getAllByTestId('news-carousel-item');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('5 Magazine');
    expect(cards[0]).toHaveTextContent('Oct 30, 2026');
    expect(cards[1]).toHaveTextContent('5 hours ago');
    expect(screen.getAllByTestId('news-carousel-title')[0]).toHaveTextContent(
      'House Music Pioneer Has Died',
    );
  });

  it('titles the date with the caller-supplied timestamp', () => {
    render(
      <NewsCarousel
        items={[{ ...ITEMS[0], publishedTitle: '30.10.2026 klo 12.00' }]}
      />,
    );
    expect(screen.getByText('Oct 30, 2026')).toHaveAttribute(
      'title',
      '30.10.2026 klo 12.00',
    );
  });

  it('opens a headline and renders the more link and extra actions', () => {
    const onClick = vi.fn();
    render(
      <NewsCarousel
        title="News"
        items={[{ ...ITEMS[0], onClick }]}
        more={<a href="/news">more News</a>}
        actions={<button type="button">Sources</button>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /House Music/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'more News' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sources' })).toBeVisible();
  });

  it('says so when there is nothing to show and disables the arrows', () => {
    render(<NewsCarousel items={[]} labels={{ empty: 'Nothing yet.' }} />);
    expect(screen.getByText('Nothing yet.')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Previous news' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next news' })).toBeDisabled();
  });
});
