import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { normalizeEvent } from '../../api/events';
import { renderWithRouter } from '../../test/renderWithRouter';
import { EventCard } from './EventCard';

const base = normalizeEvent({
  id: 'evt-1',
  title: 'Club night',
  place: 'Typed place',
  location: 'Helsinki',
  startAt: '2026-11-20T18:00:00.000Z',
});

function otherZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Tokyo'
    ? 'America/New_York'
    : 'Asia/Tokyo';
}

describe('EventCard', () => {
  afterEach(() => cleanup());

  it('shows a fans-only badge, the linked venue and the local time', async () => {
    const zone = otherZone();
    await renderWithRouter(
      <EventCard
        event={{
          ...base,
          visibility: 'FANS',
          timezone: zone,
          venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
        }}
      />,
    );
    expect(await screen.findByText('Fans only')).toBeTruthy();
    expect(screen.getByText('Kaiku, Helsinki')).toBeTruthy();
    const local = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: zone,
    }).format(new Date(base.startAt));
    expect(screen.getByTestId('event-local-time').textContent).toContain(
      `${local} in ${zone.replace(/_/g, ' ')}`,
    );
  });

  it('keeps public events plain and skips the local time in the viewer zone', async () => {
    await renderWithRouter(
      <EventCard
        event={{
          ...base,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }}
      />,
    );
    expect(await screen.findByText('Typed place, Helsinki')).toBeTruthy();
    expect(screen.queryByText('Fans only')).toBeNull();
    expect(screen.queryByTestId('event-local-time')).toBeNull();
  });
});
