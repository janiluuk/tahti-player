// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
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
});
