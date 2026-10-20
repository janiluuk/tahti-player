// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as rss from '../api/rss-feed';
import type { ListenerWidgetInstance } from '../stores/listenerWidgetsStore';
import { NewsFeedWidget } from './NewsFeedWidget';

const instance: ListenerWidgetInstance = {
  id: 'w1',
  typeId: 'news',
  input: 'https://mixmag.net/rss.xml',
  label: 'Mixmag',
  addedAt: '2026-10-21T00:00:00.000Z',
};

describe('NewsFeedWidget', () => {
  beforeEach(() => {
    vi.spyOn(rss, 'fetchRssArticles').mockResolvedValue({
      data: [
        {
          id: 'a1',
          title: 'Warehouse season opens',
          teaser: 'Short teaser',
          link: 'https://mixmag.net/read/warehouse',
          publishedAt: '2026-10-20T09:30:00.000Z',
          paragraphs: ['First paragraph.', 'Second paragraph.'],
        },
      ],
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens the article in a reader instead of leaving Tahti', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<NewsFeedWidget instance={instance} />);
    fireEvent.click(
      await screen.findByRole('button', { name: /Warehouse season opens/ }),
    );

    const article = await screen.findByTestId('news-article');
    expect(article.textContent).toContain('Second paragraph.');
    expect(article.textContent).toContain('Mixmag');
    const original = screen.getByRole('link', { name: /Read on mixmag\.net/ });
    expect(original.getAttribute('href')).toBe(
      'https://mixmag.net/read/warehouse',
    );
    expect(original.getAttribute('target')).toBe('_blank');
    expect(open).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('dialog-close'));
    await waitFor(() =>
      expect(screen.queryByTestId('news-article')).toBeNull(),
    );
  });

  it('opens the reader from the keyboard', async () => {
    render(<NewsFeedWidget instance={instance} />);
    const card = await screen.findByRole('button', {
      name: /Warehouse season opens/,
    });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(await screen.findByTestId('news-article')).toBeTruthy();
  });
});
