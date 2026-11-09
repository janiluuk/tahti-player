// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { NewsView } from './NewsView';

describe('NewsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the news failed to load instead of "No announcements yet"', async () => {
    const fetch = vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<NewsView />);
    expect(await screen.findByText('Could not load the news')).toBeTruthy();
    expect(screen.queryByText('No announcements yet.')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No announcements yet.')).toBeTruthy();
  });

  it('has the corner back arrow instead of a Help center link', async () => {
    vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await renderWithRouter(<NewsView />);
    expect(await screen.findByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Help center/ })).toBeNull();
  });

  it('lines the intro and posts up in one column with the latest marker in the meta row', async () => {
    const post = (id: string, headline: string) => ({
      id,
      headline,
      summary: 'Summary',
      authorName: 'Tahti team',
      publishedAt: '2026-11-01T10:00:00.000Z',
    });
    vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
      data: [post('n1', 'Newest'), post('n2', 'Older')],
      meta: { source: 'api' },
    });
    await renderWithRouter(<NewsView />);
    const entries = await screen.findAllByTestId('announcement-entry');
    const column = screen.getByTestId('news-column');
    expect(column).not.toHaveClass('mx-auto');
    for (const entry of entries) {
      expect(entry.parentElement).toBe(column);
    }
    const latest = within(entries[0]).getByTestId('news-latest');
    expect(latest).toHaveTextContent('Latest');
    expect(latest.parentElement).toHaveTextContent('Tahti team');
    expect(within(entries[1]).queryByTestId('news-latest')).toBeNull();
  });
});
