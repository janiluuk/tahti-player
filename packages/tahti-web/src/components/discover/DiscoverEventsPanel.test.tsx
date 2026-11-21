// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import {
  fetchEventCalendar,
  type CalendarEvent,
} from '../../api/event-calendar';
import { normalizeEvent } from '../../api/events';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { DiscoverEventsPanel } from './DiscoverEventsPanel';
import { DEFAULT_EVENTS_FILTERS, type EventsFilters } from './eventFilters';

vi.mock('../../api/event-calendar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/event-calendar')>()),
  fetchEventCalendar: vi.fn(),
}));

const DAY = 86_400_000;
const NOW = new Date(2030, 5, 10, 12, 0);
const TODAY = new Date(2030, 5, 10).getTime();

function row(
  id: string,
  title: string,
  day: number,
  patch: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    ...normalizeEvent({
      id,
      title,
      place: '',
      location: '',
      startAt: new Date(2030, 5, day, 20).toISOString(),
      timezone: 'Europe/Helsinki',
    }),
    artistDisplayName: 'Northern Lights',
    artistUsername: 'northern-lights',
    channelSlug: 'northern-lights',
    avatarUrl: null,
    ...patch,
  };
}

const rooftop = row('evt-a', 'Rooftop closing set', 21, {
  imageUrl: 'https://media.example/banner.jpg',
  venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
});
const garage = row('evt-b', 'Garage jam', 14, {
  place: 'Garage',
  location: 'Tampere',
  artistDisplayName: 'Basement Crew',
});
const club = row('evt-c', 'Club night', 17, {
  place: 'Tavastia',
  location: 'Helsinki, Finland',
});

function serve(items: CalendarEvent[], reason?: string) {
  vi.mocked(fetchEventCalendar).mockResolvedValue({
    data: items,
    meta: reason ? { source: 'api', reason } : { source: 'api' },
  });
}

function lastWindow() {
  const calls = vi.mocked(fetchEventCalendar).mock.calls;
  const { from, to } = calls[calls.length - 1][0];
  return { from: from.getTime(), to: to.getTime() };
}

function cardTitles() {
  return screen
    .getAllByTestId('discover-event-card')
    .map((card) => within(card).getByRole('link').textContent);
}

function optionLabels() {
  return screen
    .getAllByRole('option')
    .map((option) => option.textContent?.replace('✓', '').trim());
}

function signIn() {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'listener@tahti.live',
      username: 'listener',
      displayName: 'Listener',
      role: 'LISTENER',
      isBoard: false,
      isMember: false,
    },
    hydrated: true,
  });
}

const renderPanel = (props: Parameters<typeof DiscoverEventsPanel>[0] = {}) =>
  renderWithRouter(
    <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
      <DiscoverEventsPanel {...props} />
    </MediaArtworkDefaultProvider>,
    { paths: ['/events/$eventId', '/events/new'] },
  );

async function choose(select: string, option: string) {
  await userEvent.click(screen.getByRole('button', { name: select }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('DiscoverEventsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
    useAuthModalStore.setState({ isOpen: false });
  });

  it('lists the next 92 days soonest first with banner, venue and event link', async () => {
    serve([rooftop, garage, club]);
    const { container } = await renderPanel();
    expect(await screen.findByText('Rooftop closing set')).toBeTruthy();
    expect(lastWindow()).toEqual({ from: TODAY, to: TODAY + 92 * DAY });
    expect(cardTitles()).toEqual([
      'Garage jam',
      'Club night',
      'Rooftop closing set',
    ]);
    expect(
      screen.getByRole('link', { name: 'Rooftop closing set' }),
    ).toHaveAttribute('href', '/events/evt-a');
    expect(screen.getByText('Kaiku, Helsinki')).toBeTruthy();
    expect(screen.getByText('Garage, Tampere')).toBeTruthy();
    const images = [...container.querySelectorAll('img')].map((img) =>
      img.getAttribute('src'),
    );
    expect(images).toEqual([
      '/artwork/evt-b.webp',
      '/artwork/evt-c.webp',
      'https://media.example/banner.jpg',
    ]);
  });

  it('refetches with the window of the chosen range', async () => {
    serve([rooftop]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'This week' }));
    });
    expect(lastWindow()).toEqual({
      from: TODAY,
      to: new Date(2030, 5, 17).getTime(),
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'This month' }));
    });
    expect(lastWindow()).toEqual({
      from: TODAY,
      to: new Date(2030, 6, 1).getTime(),
    });
    expect(fetchEventCalendar).toHaveBeenCalledTimes(3);
  });

  it('shows past events from the last 92 days newest first, marked as past', async () => {
    serve([rooftop]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    serve([row('old-1', 'Spring rave', 2), row('old-2', 'Summer opener', 8)]);
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Past events' }));
    });
    expect(await screen.findByText('Summer opener')).toBeTruthy();
    expect(lastWindow()).toEqual({ from: TODAY - 92 * DAY, to: TODAY });
    expect(cardTitles()).toEqual(['Summer opener', 'Spring rave']);
    for (const card of screen.getAllByTestId('discover-event-card')) {
      expect(card).toHaveAttribute('data-past', 'true');
      expect(within(card).getByText('Past')).toBeTruthy();
    }
    expect(screen.queryByRole('radiogroup', { name: 'Date range' })).toBeNull();
  });

  it('narrows venues to the chosen city and filters by both', async () => {
    serve([rooftop, garage, club]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    await userEvent.click(screen.getByRole('button', { name: 'Venue' }));
    expect(optionLabels()).toEqual([
      'All venues',
      'Garage',
      'Kaiku',
      'Tavastia',
    ]);
    await userEvent.keyboard('{Escape}');

    await choose('City', 'Helsinki');
    expect(cardTitles()).toEqual(['Club night', 'Rooftop closing set']);
    await userEvent.click(screen.getByRole('button', { name: 'Venue' }));
    expect(optionLabels()).toEqual(['All venues', 'Kaiku', 'Tavastia']);
    await userEvent.click(screen.getByRole('option', { name: 'Kaiku' }));
    expect(cardTitles()).toEqual(['Rooftop closing set']);
  });

  it('searches title, place, venue and host after a pause in typing', async () => {
    serve([rooftop, garage, club]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search events' }), {
      target: { value: 'basement' },
    });
    expect(cardTitles()).toHaveLength(3);
    await waitFor(() => expect(cardTitles()).toEqual(['Garage jam']));
  });

  it('offers Clear filters when nothing matches', async () => {
    serve([rooftop, garage]);
    await renderPanel({
      filters: { ...DEFAULT_EVENTS_FILTERS, city: 'Tampere', q: 'rooftop' },
      onFiltersChange: vi.fn(),
    });
    expect(
      await screen.findByText('No events match these filters'),
    ).toBeTruthy();
  });

  it('clears city, venue and search from the empty state', async () => {
    serve([rooftop, garage]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    await choose('City', 'Tampere');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search events' }), {
      target: { value: 'rooftop' },
    });
    expect(
      await screen.findByText('No events match these filters'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(cardTitles()).toEqual(['Garage jam', 'Rooftop closing set']);
    expect(
      screen.getByRole('searchbox', { name: 'Search events' }),
    ).toHaveValue('');
  });

  it('switches to the calendar with the same filtered events', async () => {
    serve([rooftop, garage, club]);
    await renderPanel();
    await screen.findByText('Rooftop closing set');
    await choose('City', 'Helsinki');
    fireEvent.click(screen.getByRole('radio', { name: 'Calendar' }));
    const calendar = await screen.findByTestId('event-calendar');
    expect(within(calendar).getByText('Club night')).toBeTruthy();
    expect(within(calendar).getByText('Rooftop closing set')).toBeTruthy();
    expect(within(calendar).queryByText('Garage jam')).toBeNull();
    expect(screen.queryByTestId('discover-event-card')).toBeNull();
    expect(fetchEventCalendar).toHaveBeenCalledTimes(1);
  });

  it('renders from URL filters and reports changes, replacing history for search', async () => {
    serve([rooftop, garage, club]);
    const onFiltersChange = vi.fn();
    const filters: EventsFilters = {
      ...DEFAULT_EVENTS_FILTERS,
      range: 'month',
      city: 'Helsinki',
      view: 'calendar',
    };
    await renderPanel({ filters, onFiltersChange });
    expect(await screen.findByTestId('event-calendar')).toBeTruthy();
    expect(lastWindow().to).toBe(new Date(2030, 6, 1).getTime());
    expect(screen.getByRole('button', { name: 'City' })).toHaveTextContent(
      'Helsinki',
    );
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Events view' })).getByRole(
        'radio',
        { name: 'List' },
      ),
    );
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      { ...filters, view: 'list' },
      undefined,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search events' }), {
      target: { value: ' club ' },
    });
    await waitFor(() =>
      expect(onFiltersChange).toHaveBeenLastCalledWith(
        { ...filters, q: 'club' },
        { replace: true },
      ),
    );
  });

  it('shows the empty state when nothing is coming up', async () => {
    serve([]);
    await renderPanel();
    expect(await screen.findByText('No upcoming events')).toBeTruthy();
  });

  it('shows the error and retries', async () => {
    serve([], 'HTTP 503');
    await renderPanel();
    expect(await screen.findByText('Could not load events')).toBeTruthy();
    serve([rooftop]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(await screen.findByText('Rooftop closing set')).toBeTruthy();
    expect(fetchEventCalendar).toHaveBeenCalledTimes(2);
  });

  it('links Post event to the form when signed in', async () => {
    signIn();
    serve([]);
    await renderPanel();
    expect(screen.getByRole('link', { name: 'Post event' })).toHaveAttribute(
      'href',
      '/events/new',
    );
  });

  it('asks a signed-out visitor to sign in from Post event', async () => {
    serve([]);
    await renderPanel();
    expect(screen.queryByRole('link', { name: 'Post event' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Post event' }));
    expect(useAuthModalStore.getState().isOpen).toBe(true);
    expect(useAuthModalStore.getState().mode).toBe('login');
  });
});
