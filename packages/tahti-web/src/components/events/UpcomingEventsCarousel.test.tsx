// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import type { UpcomingEvent } from '../../api/upcoming-events';
import { renderWithRouter } from '../../test/renderWithRouter';
import { UpcomingEventsCarousel } from './UpcomingEventsCarousel';

// jsdom has no PointerEvent; without it fireEvent drops clientX and button.
if (!('PointerEvent' in globalThis)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
    }
  }
  vi.stubGlobal('PointerEvent', PointerEventPolyfill);
}

function event(id: string, title: string, startAt: string): UpcomingEvent {
  return {
    id,
    title,
    description: null,
    place: 'Kuudes Linja',
    location: 'Helsinki',
    eventUrl: null,
    startAt,
    gallery: [],
    imageUrl: `https://media.example/${id}.jpg`,
    artistDisplayName: 'Night Owls',
    artistUsername: 'night-owls',
    channelSlug: 'night-owls',
    avatarUrl: null,
    timezone: 'Europe/Helsinki',
  };
}

const events = [
  event('e1', 'First show', '2030-05-04T18:00:00.000Z'),
  event('e2', 'Second show', '2030-05-05T19:30:00.000Z'),
  event('e3', 'Third show', '2030-05-06T20:00:00.000Z'),
];

async function renderCarousel(list: UpcomingEvent[] = events) {
  return renderWithRouter(
    <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
      <UpcomingEventsCarousel events={list} />
    </MediaArtworkDefaultProvider>,
    { paths: ['/events/$eventId'] },
  );
}

const title = () => screen.getByTestId('event-card-title').textContent;

describe('UpcomingEventsCarousel', () => {
  it('browses with the arrow buttons and wraps around both ends', async () => {
    await renderCarousel();

    expect(title()).toBe('First show');
    expect(screen.getByTestId('upcoming-events-position')).toHaveTextContent(
      '1 / 3',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous event' }));
    expect(title()).toBe('Third show');
    fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
    expect(title()).toBe('First show');
    fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
    expect(title()).toBe('Second show');
  });

  it('browses with the arrow keys and opens the event with Enter', async () => {
    const { router } = await renderCarousel();
    const carousel = screen.getByTestId('upcoming-events');

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(title()).toBe('First show');
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(title()).toBe('Third show');
    fireEvent.keyDown(carousel, { key: 'Enter' });
    expect(router.state.location.pathname).toBe('/events/e3');
  });

  it('swipes to the next event without opening it', async () => {
    const { router } = await renderCarousel();
    const slide = screen.getByTestId('upcoming-events-slide');
    const surface = slide.parentElement!;

    fireEvent.pointerDown(surface, { button: 0, clientX: 300, clientY: 100 });
    fireEvent.pointerUp(surface, { clientX: 200, clientY: 110 });
    fireEvent.click(screen.getByTestId('upcoming-events-slide'));

    expect(title()).toBe('Second show');
    expect(router.state.location.pathname).not.toBe('/events/e2');
  });

  it('shows the start time on a 24-hour clock in the event time zone', async () => {
    await renderCarousel([events[1]!]);

    expect(screen.getByTestId('event-card-start').textContent).toMatch(/22:30/);
  });

  it('hides the browse controls for a single event', async () => {
    await renderCarousel([events[0]!]);

    expect(screen.queryByRole('button', { name: 'Next event' })).toBeNull();
    expect(screen.queryByTestId('upcoming-events-position')).toBeNull();
  });

  it('casts the glow from the event image', async () => {
    await renderCarousel();

    expect(
      screen.getByTestId('upcoming-events-glow').style.backgroundImage,
    ).toContain('https://media.example/e1.jpg');
  });
});
