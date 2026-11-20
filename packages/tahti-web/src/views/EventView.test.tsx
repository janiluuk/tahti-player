// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import * as calendar from '../api/event-calendar';
import type { CalendarEvent } from '../api/event-calendar';
import { renderWithRouter } from '../test/renderWithRouter';
import { EventView } from './EventView';

async function mockEvent(): Promise<CalendarEvent> {
  const { data } = await calendar.fetchEventCalendar({
    from: new Date(Date.now() - 60 * 86_400_000),
    to: new Date(Date.now() + 30 * 86_400_000),
  });
  const [event] = data;
  if (!event) {
    throw new Error('no mock events');
  }
  return event;
}

describe('EventView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('shows the last loaded event at once on a revisit', async () => {
    const event = await mockEvent();
    const fetch = vi
      .spyOn(calendar, 'fetchPublicEvent')
      .mockResolvedValue({ data: event, meta: { source: 'api' } });
    const first = await renderWithRouter(<EventView eventId={event.id} />);
    expect(await screen.findByTestId('event-page')).toBeTruthy();
    first.unmount();

    fetch.mockReturnValue(new Promise(() => {}));
    await renderWithRouter(<EventView eventId={event.id} />);
    expect(screen.getByTestId('event-page')).toBeTruthy();
    expect(screen.queryByText('Loading events…')).toBeNull();
  });

  it('keeps the saved event and says the refresh failed', async () => {
    const event = await mockEvent();
    const fetch = vi
      .spyOn(calendar, 'fetchPublicEvent')
      .mockResolvedValue({ data: event, meta: { source: 'api' } });
    const first = await renderWithRouter(<EventView eventId={event.id} />);
    expect(await screen.findByTestId('event-page')).toBeTruthy();
    first.unmount();

    fetch.mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<EventView eventId={event.id} />);
    expect(
      await screen.findByText(
        'Could not refresh; showing the last loaded version.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('event-page')).toBeTruthy();
  });

  it('says the event was not found when nothing was saved', async () => {
    vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 404' },
    });
    await renderWithRouter(<EventView eventId="missing" />);
    expect(await screen.findByText('Event not found')).toBeTruthy();
  });

  it('puts the banner in the hero and its blurred backdrop', async () => {
    const event = {
      ...(await mockEvent()),
      imageUrl: 'https://media.example/banner.jpg',
      venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
    };
    vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
      data: event,
      meta: { source: 'api' },
    });
    await renderWithRouter(<EventView eventId={event.id} />);
    const backdrop = await screen.findByTestId('event-banner-backdrop');
    expect(backdrop.querySelector('img')).toHaveAttribute(
      'src',
      'https://media.example/banner.jpg',
    );
    expect(screen.getByAltText(`Banner for ${event.title}`)).toHaveAttribute(
      'src',
      'https://media.example/banner.jpg',
    );
    expect(screen.getByTestId('event-venue').textContent).toContain('Kaiku');
    expect(screen.getByRole('link', { name: 'Kaiku' })).toHaveAttribute(
      'href',
      '/v/kaiku',
    );
  });

  it('falls back to the default artwork without a banner', async () => {
    const event = { ...(await mockEvent()), imageUrl: null, venue: null };
    vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
      data: event,
      meta: { source: 'api' },
    });
    await renderWithRouter(
      <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
        <EventView eventId={event.id} />
      </MediaArtworkDefaultProvider>,
    );
    const backdrop = await screen.findByTestId('event-banner-backdrop');
    expect(backdrop.querySelector('img')).toHaveAttribute(
      'src',
      `/artwork/${event.id}.webp`,
    );
    expect(screen.queryByTestId('event-venue')).toBeNull();
  });
});
