import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchChannelSchedule,
  type PublicChannelSchedule,
} from '../../api/channel-schedule';
import {
  ChannelUpcomingShows,
  formatShowDuration,
} from './ChannelUpcomingShows';

vi.mock('../../api/channel-schedule', () => ({
  fetchChannelSchedule: vi.fn(),
}));

async function renderShows(schedule: PublicChannelSchedule) {
  vi.mocked(fetchChannelSchedule).mockResolvedValue(schedule);
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<ChannelUpcomingShows slug="night-drive" />);
  });
  return result!;
}

describe('ChannelUpcomingShows', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists upcoming shows in local time with duration and series notes', async () => {
    const startAt = '2026-11-06T20:00:00.000Z';
    await renderShows({
      shows: [
        {
          id: 's1',
          seriesId: 'series-1',
          startAt,
          endAt: null,
          durationMin: 90,
          title: 'Friday Night Set #4',
          episodeNumber: 4,
          showType: 'LIVE_SET',
        },
      ],
      series: [
        {
          id: 'series-1',
          name: 'Friday Night Set',
          scheduleNote: 'Fridays 22:00 EET',
        },
      ],
    });

    expect(fetchChannelSchedule).toHaveBeenCalledWith('night-drive');
    expect(
      screen.getByRole('region', { name: 'Upcoming shows' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Friday Night Set #4')).toBeInTheDocument();
    expect(screen.getByText('1 h 30 min')).toBeInTheDocument();
    expect(screen.getByText(/Fridays 22:00 EET/)).toBeInTheDocument();
    const time = document.querySelector('time');
    expect(time).toHaveAttribute('dateTime', startAt);
    expect(time?.textContent).toBe(
      new Date(startAt).toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    );
  });

  it('renders nothing when there are no upcoming shows', async () => {
    const { container } = await renderShows({ shows: [], series: [] });
    expect(container).toBeEmptyDOMElement();
  });
});

describe('formatShowDuration', () => {
  it('formats minutes as hours and minutes', () => {
    expect(formatShowDuration(45)).toBe('45 min');
    expect(formatShowDuration(120)).toBe('2 h');
    expect(formatShowDuration(150)).toBe('2 h 30 min');
  });
});
