// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
});
