// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as userMedia from '../api/user-media';
import { LibraryMediaView } from './LibraryMediaView';

describe('LibraryMediaView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the media failed to load instead of "No media files yet"', async () => {
    const fetch = vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<LibraryMediaView />);
    expect(
      await screen.findByText('Could not load your media files'),
    ).toBeTruthy();
    expect(screen.queryByText(/No media files yet/)).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No media files yet/)).toBeTruthy();
  });

  it('filters by kind and clears the filter from the empty state', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: '1',
          filename: 'bg.png',
          url: 'https://x/bg.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        },
        {
          id: '2',
          filename: 'loop.mp4',
          url: 'https://x/loop.mp4',
          contentType: 'video/mp4',
          sizeBytes: 2048,
        },
      ],
      meta: { source: 'api' },
    } as never);
    render(<LibraryMediaView />);
    expect(await screen.findByText('bg.png')).toBeTruthy();
    expect(screen.getByText('loop.mp4')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Videos' }));
    expect(screen.queryByText('bg.png')).toBeNull();
    expect(screen.getByText('loop.mp4')).toBeTruthy();
  });
});
