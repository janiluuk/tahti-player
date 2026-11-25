// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import * as calendar from '../api/event-calendar';
import type { CalendarEvent } from '../api/event-calendar';
import * as upcoming from '../api/upcoming-events';
import { useEventBrowseStore } from '../stores/eventBrowseStore';
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
    useEventBrowseStore.setState({ items: null, arrival: null });
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

  describe('previous / next', () => {
    async function openInRow(position: 'first' | 'middle') {
      const event = await mockEvent();
      vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
        data: event,
        meta: { source: 'api' },
      });
      const upcomingFetch = vi
        .spyOn(upcoming, 'fetchUpcomingEvents')
        .mockResolvedValue({ data: [], meta: { source: 'api' } });
      const row =
        position === 'middle'
          ? [
              { id: 'evt-a', title: 'Opening night' },
              { id: event.id, title: event.title },
              { id: 'evt-c', title: 'Closing party' },
            ]
          : [
              { id: event.id, title: event.title },
              { id: 'evt-c', title: 'Closing party' },
            ];
      useEventBrowseStore.getState().remember(row);
      const rendered = await renderWithRouter(
        <EventView eventId={event.id} />,
        { paths: ['/events/$eventId'] },
      );
      await screen.findByTestId('event-page');
      return { ...rendered, event, upcomingFetch };
    }

    it('names the neighbouring events of the row it was opened from', async () => {
      const { upcomingFetch } = await openInRow('middle');
      const nav = screen.getByRole('navigation', { name: 'Browse events' });
      expect(
        within(nav).getByRole('button', {
          name: 'Previous event: Opening night',
        }),
      ).toBeEnabled();
      expect(
        within(nav).getByRole('button', { name: 'Next event: Closing party' }),
      ).toBeEnabled();
      expect(within(nav).getByText('2 of 3')).toBeTruthy();
      expect(upcomingFetch).not.toHaveBeenCalled();
    });

    it('does not wrap: the first event has no previous one', async () => {
      await openInRow('first');
      expect(
        screen.getByRole('button', { name: 'No previous event' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Next event: Closing party' }),
      ).toBeEnabled();
    });

    it('moves to the next event with the button', async () => {
      const { router } = await openInRow('middle');
      fireEvent.click(
        screen.getByRole('button', { name: 'Next event: Closing party' }),
      );
      await vi.waitFor(() =>
        expect(router.state.location.pathname).toBe('/events/evt-c'),
      );
      expect(useEventBrowseStore.getState().arrival).toEqual({
        eventId: 'evt-c',
        direction: 'next',
      });
    });

    it('moves with the arrow keys unless a text field has focus', async () => {
      const { router } = await openInRow('middle');
      const field = document.createElement('textarea');
      document.body.append(field);
      fireEvent.keyDown(field, { key: 'ArrowLeft' });
      expect(router.state.location.pathname).toBe('/');
      field.remove();

      fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
      await vi.waitFor(() =>
        expect(router.state.location.pathname).toBe('/events/evt-a'),
      );
    });

    it('moves with a sideways swipe but not a vertical scroll', async () => {
      const { router } = await openInRow('middle');
      const surface = screen.getByTestId('event-browse-surface');
      fireEvent.touchStart(surface, {
        touches: [{ clientX: 200, clientY: 300 }],
      });
      fireEvent.touchEnd(surface, {
        changedTouches: [{ clientX: 180, clientY: 100 }],
      });
      expect(router.state.location.pathname).toBe('/');

      fireEvent.touchStart(surface, {
        touches: [{ clientX: 300, clientY: 300 }],
      });
      fireEvent.touchEnd(surface, {
        changedTouches: [{ clientX: 150, clientY: 310 }],
      });
      await vi.waitFor(() =>
        expect(router.state.location.pathname).toBe('/events/evt-c'),
      );
    });

    it('falls back to upcoming events when opened directly', async () => {
      const event = await mockEvent();
      vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
        data: event,
        meta: { source: 'api' },
      });
      vi.spyOn(upcoming, 'fetchUpcomingEvents').mockResolvedValue({
        data: [
          { ...event, id: 'evt-before', title: 'Earlier gig' },
          event,
        ] as upcoming.UpcomingEvent[],
        meta: { source: 'api' },
      });
      await renderWithRouter(<EventView eventId={event.id} />);
      expect(
        await screen.findByRole('button', {
          name: 'Previous event: Earlier gig',
        }),
      ).toBeEnabled();
      expect(
        screen.getByRole('button', { name: 'No next event' }),
      ).toBeDisabled();
    });

    it('hides the arrows when the event is in no list', async () => {
      const event = await mockEvent();
      vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
        data: event,
        meta: { source: 'api' },
      });
      const upcomingFetch = vi
        .spyOn(upcoming, 'fetchUpcomingEvents')
        .mockResolvedValue({ data: [], meta: { source: 'api' } });
      await renderWithRouter(<EventView eventId={event.id} />);
      await screen.findByTestId('event-page');
      await vi.waitFor(() => expect(upcomingFetch).toHaveBeenCalled());
      expect(screen.queryByTestId('event-browse')).toBeNull();
    });
  });

  it('keeps the share links and comments in the side panel', async () => {
    const event = { ...(await mockEvent()), status: 'PUBLISHED' as const };
    vi.spyOn(calendar, 'fetchPublicEvent').mockResolvedValue({
      data: event,
      meta: { source: 'api' },
    });
    await renderWithRouter(<EventView eventId={event.id} />);
    const panel = await screen.findByRole('complementary', {
      name: 'Event actions and comments',
    });
    expect(
      within(panel).getByRole('link', { name: /Add to Google Calendar/ }),
    ).toBeTruthy();
    expect(await within(panel).findByTestId('event-comments')).toBeTruthy();
    expect(
      within(screen.getByTestId('event-main')).queryByTestId('event-comments'),
    ).toBeNull();
  });
});
