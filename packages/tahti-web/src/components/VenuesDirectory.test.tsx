import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { VenuesDirectory } from './VenuesDirectory';

const renderDirectory = () =>
  renderWithRouter(
    <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
      <VenuesDirectory />
    </MediaArtworkDefaultProvider>,
    { paths: ['/v/$slug', '/venues/register'] },
  );

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
    const { container } = await renderDirectory();
    await screen.findByRole('link', { name: 'Kaiku' });
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
    const { container } = await renderDirectory();
    await screen.findByRole('link', { name: 'Kaiku' });
    expect(
      container.querySelector('img[src="https://cdn.example.com/wide.jpg"]'),
    ).toBeTruthy();
  });

  it('keeps the filled thumbnail inside its own box', async () => {
    vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [{ ...venue, photos: ['https://cdn.example.com/kaiku.jpg'] }],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    const { container } = await renderDirectory();
    await screen.findByRole('link', { name: 'Kaiku' });
    const img = container.querySelector(
      'img[src="https://cdn.example.com/kaiku.jpg"]',
    );
    const frame = img?.closest('.relative.aspect-square');
    expect(frame?.closest('[data-testid="card"]')).toBeTruthy();
  });

  it('says the venues failed to load instead of "No verified venues"', async () => {
    const fetch = vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    await renderDirectory();
    expect(await screen.findByText('Could not load venues')).toBeTruthy();
    expect(screen.queryByText('No verified venues')).toBeNull();

    fetch.mockResolvedValue({
      data: [{ ...venue, photos: [] }],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Kaiku')).toBeTruthy();
  });

  it('shows the default artwork and links the card title when a venue has no photo', async () => {
    vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [{ ...venue, photos: [] }],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    const { container } = await renderDirectory();
    const view = await screen.findByRole('link', { name: 'Kaiku' });
    expect(view.getAttribute('href')).toBe('/v/kaiku');
    expect(
      container.querySelector('img[src="/artwork/kaiku.webp"]'),
    ).toBeTruthy();
    expect(screen.getByText('Helsinki, 🇫🇮 Finland · cap. 300')).toBeTruthy();
  });

  it('offers Register a venue as a button link when there are none', async () => {
    vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchVenues>>);
    await renderDirectory();
    const link = await screen.findByRole('link', { name: 'Register a venue' });
    expect(link.getAttribute('href')).toBe('/venues/register');
  });
});
