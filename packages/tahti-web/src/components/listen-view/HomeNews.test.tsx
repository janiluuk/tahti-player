import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import { renderWithRouter } from '../../test/renderWithRouter';
import { HomeNews } from './HomeNews';

const post = (id: string, headline: string, publishedAt: string) => ({
  id,
  headline,
  summary: `${headline} summary`,
  authorName: 'Board',
  publishedAt,
});

describe('HomeNews', () => {
  it('shows the newest posts first and links to all news', async () => {
    vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
      data: [
        post('a', 'Older post', '2026-09-01T00:00:00.000Z'),
        post('b', 'Beta is open', '2026-10-01T00:00:00.000Z'),
      ],
      meta: { source: 'api' },
    });

    const { router } = await renderWithRouter(<HomeNews limit={1} />, {
      paths: ['/news'],
    });

    expect(await screen.findByText('Beta is open')).toBeVisible();
    expect(screen.queryByText('Older post')).toBeNull();
    await userEvent.click(screen.getByRole('link', { name: 'All news' }));
    expect(router.state.location.pathname).toBe('/news');
  });

  it('offers Retry when news fails to load', async () => {
    vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
      data: [],
      meta: { source: 'mock', reason: 'Network error' },
    });

    await renderWithRouter(<HomeNews />);

    expect(await screen.findByRole('button', { name: /Retry/ })).toBeVisible();
  });
});

it('opens the selected article in a modal with artwork and publication date', async () => {
  vi.spyOn(client, 'fetchAnnouncements').mockResolvedValue({
    data: [post('opening', 'Tahti is open', '2026-10-30T08:00:00.000Z')],
    meta: { source: 'api' },
  });
  await renderWithRouter(<HomeNews />);
  await userEvent.click(await screen.findByText('Tahti is open'));
  expect(await screen.findByRole('dialog')).toBeVisible();
  expect(screen.getByTestId('news-published-at')).toHaveAttribute(
    'datetime',
    '2026-10-30T08:00:00.000Z',
  );
  expect(
    screen.getByRole('img', { name: 'Tahti is open artwork' }),
  ).toHaveAttribute('src', '/news-opening.svg');
});
