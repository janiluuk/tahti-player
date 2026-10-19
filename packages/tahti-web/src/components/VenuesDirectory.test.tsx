import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { VenuesDirectory } from './VenuesDirectory';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

const venue = {
  id: 'v1',
  slug: 'kaiku',
  name: 'Kaiku',
  city: 'Helsinki',
  countryCode: 'FI',
  capacity: 300,
  description: null,
};

describe('VenuesDirectory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a venue's only photo on its card", async () => {
    vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [{ ...venue, photos: ['https://cdn.example.com/kaiku.jpg'] }],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    const { container } = render(<VenuesDirectory />);
    await screen.findByText('View venue →');
    expect(
      container.querySelector('img[src="https://cdn.example.com/kaiku.jpg"]'),
    ).toBeTruthy();
  });

  it('prefers the wide second photo when there are two', async () => {
    vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [
        {
          ...venue,
          photos: [
            'https://cdn.example.com/square.jpg',
            'https://cdn.example.com/wide.jpg',
          ],
        },
      ],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    const { container } = render(<VenuesDirectory />);
    await screen.findByText('View venue →');
    expect(
      container.querySelector('img[src="https://cdn.example.com/wide.jpg"]'),
    ).toBeTruthy();
  });

  it('says the venues failed to load instead of "No verified venues"', async () => {
    const fetch = vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    render(<VenuesDirectory />);
    expect(await screen.findByText('Could not load venues')).toBeTruthy();
    expect(screen.queryByText('No verified venues')).toBeNull();

    fetch.mockResolvedValue({
      data: [{ ...venue, photos: [] }],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Kaiku')).toBeTruthy();
  });
});
