// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { HistoryEntry } from '../../stores/libraryStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { HistoryListSection } from './HistoryListSection';

const history = Array.from(
  { length: 40 },
  (_, index) =>
    ({
      playedAt: new Date(Date.UTC(2026, 9, 1, 12, index)).toISOString(),
      playable: {
        id: `track-${index}`,
        kind: 'track',
        title: `Track ${index}`,
        artist: 'Artist',
        streamUrl: 'https://example.com/a.mp3',
      },
    }) as HistoryEntry,
);

describe('HistoryListSection', () => {
  it('keeps the page-size picker after a size that fits everything on one page', async () => {
    await renderWithRouter(<HistoryListSection history={history} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();

    await userEvent.click(
      screen.getByRole('button', { name: /Tracks per page/ }),
    );
    await userEvent.click(await screen.findByRole('option', { name: '50' }));

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
    expect(
      screen.getByRole('button', { name: /Tracks per page/ }),
    ).toBeInTheDocument();
  });
});
