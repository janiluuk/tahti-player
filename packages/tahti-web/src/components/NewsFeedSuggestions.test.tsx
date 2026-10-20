// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NEWS_FEED_PRESET_GROUPS } from '../content/newsFeedPresets';
import { NewsFeedSuggestions } from './NewsFeedSuggestions';

describe('NewsFeedSuggestions', () => {
  afterEach(cleanup);

  it('adds a DJ feed and marks feeds already added', () => {
    const onAdd = vi.fn();
    render(
      <NewsFeedSuggestions
        addedUrls={new Set(['https://mixmag.net/rss.xml'])}
        onAdd={onAdd}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add DJ Mag' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://djmag.com/rss.xml' }),
    );
    expect(screen.getByRole('button', { name: 'Mixmag added' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('only offers https feeds, each once', () => {
    const urls = NEWS_FEED_PRESET_GROUPS.flatMap((group) =>
      group.feeds.map((feed) => feed.url),
    );
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith('https://'))).toBe(true);
  });
});
