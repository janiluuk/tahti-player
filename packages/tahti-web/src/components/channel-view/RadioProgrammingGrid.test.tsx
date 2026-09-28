// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as shows from '../../api/shows';
import type { PublicRadioSlot } from '../../api/shows';
import { groupSlotsByDay, RadioProgrammingGrid } from './RadioProgrammingGrid';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: { channelSlug: string };
  }) => <a href={`/radio/show/${params.channelSlug}`}>{children}</a>,
}));

const slot = (
  id: string,
  startAt: Date,
  hours: number,
  overrides: Partial<PublicRadioSlot> = {},
): PublicRadioSlot => ({
  id,
  startAt: startAt.toISOString(),
  endAt: new Date(startAt.getTime() + hours * 3_600_000).toISOString(),
  note: null,
  showType: 'LIVE_SET',
  coverUrl: null,
  artist: {
    displayName: `Artist ${id}`,
    username: id,
    avatarUrl: null,
    channelSlug: id,
  },
  ...overrides,
});

const now = new Date(2026, 8, 28, 12, 0);
const at = (dayOffset: number, hour: number) =>
  new Date(2026, 8, 28 + dayOffset, hour, 0);

describe('groupSlotsByDay', () => {
  it('orders slots and groups them under the local day they start on', () => {
    const days = groupSlotsByDay(
      [
        slot('b', at(1, 20), 2),
        slot('a', at(0, 18), 1),
        slot('c', at(1, 9), 1),
      ],
      now,
    );

    expect(days.map((day) => day.label)[0]).toBe('Today');
    expect(days).toHaveLength(2);
    expect(days[1]!.slots.map((item) => item.id)).toEqual(['c', 'b']);
  });
});

describe('RadioProgrammingGrid', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('asks for the next seven days and lists each show with its artist', async () => {
    const spy = vi.spyOn(shows, 'fetchPublicRadioSlots').mockResolvedValue({
      data: [
        slot('live', at(0, 11), 2),
        slot('talk', at(2, 19), 1, { showType: 'TALK' }),
        slot('noted', at(3, 21), 1, { note: 'Album premiere' }),
      ],
      meta: { source: 'api' },
    });

    render(<RadioProgrammingGrid nowMs={now.getTime()} />);

    expect(await screen.findByText('Artist live')).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(
      now.toISOString(),
      new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    );
    expect(screen.getByText('On air')).toBeTruthy();
    expect(screen.getByText('Talk show')).toBeTruthy();
    expect(screen.getByText('Album premiere')).toBeTruthy();
    expect(
      screen.getByText('Artist talk').closest('a')?.getAttribute('href'),
    ).toBe('/radio/show/talk');
  });

  it('says when nothing is booked, and when the calendar failed to load', async () => {
    vi.spyOn(shows, 'fetchPublicRadioSlots').mockResolvedValueOnce({
      data: [],
      meta: { source: 'api' },
    });
    render(<RadioProgrammingGrid nowMs={now.getTime()} />);
    expect(
      await screen.findByText('No live shows booked in the next 7 days.'),
    ).toBeTruthy();
    cleanup();

    vi.spyOn(shows, 'fetchPublicRadioSlots').mockResolvedValueOnce({
      data: [],
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    render(<RadioProgrammingGrid nowMs={now.getTime()} />);
    expect(
      await screen.findByText("This week's shows couldn't be loaded."),
    ).toBeTruthy();
  });
});
