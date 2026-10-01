import { render, screen } from '@testing-library/react';
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
});
