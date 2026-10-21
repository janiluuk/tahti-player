import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicRadioShowEpisode } from '../api/shows';
import { RadioShowEpisodeList } from './RadioShowEpisodeList';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    to,
    params,
  }: {
    children: ReactNode;
    to: string;
    params: { id: string };
  }) => <a href={to.replace('$id', params.id)}>{children}</a>,
}));

const baseEpisode: PublicRadioShowEpisode = {
  id: 'slot-1',
  startAt: '2026-09-01T18:00:00.000Z',
  endAt: '2026-09-01T20:00:00.000Z',
  note: null,
  showType: 'LIVE_SET',
};

describe('RadioShowEpisodeList', () => {
  it("shows an aired episode's name, description, cover and recording link", () => {
    const { container } = render(
      <RadioShowEpisodeList
        emptyMessage="Nothing has aired yet."
        episodes={[
          {
            ...baseEpisode,
            note: 'Slow techno for a Friday',
            title: 'Deep Forest #3',
            description: 'Two hours of slow techno.',
            coverUrl: 'https://cdn.example.com/deep-forest-3.jpg',
            recording: {
              soundId: 'sound-1',
              title: 'Deep Forest #3 (recording)',
              channelItemUrl: 'https://tahti.live/c/artist#sound-item-sound-1',
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('Deep Forest #3')).toBeTruthy();
    expect(screen.getByText('Slow techno for a Friday')).toBeTruthy();
    expect(screen.getByText('Two hours of slow techno.')).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="https://cdn.example.com/deep-forest-3.jpg"]',
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Listen to the recording' })
        .getAttribute('href'),
    ).toBe('/t/sound-1');
  });

  it('falls back to the recording title, then the slot note, and skips the link without a recording', () => {
    render(
      <RadioShowEpisodeList
        emptyMessage="Nothing has aired yet."
        episodes={[
          {
            ...baseEpisode,
            id: 'slot-2',
            recording: {
              soundId: 'sound-2',
              title: 'Saturday set',
              channelItemUrl: 'https://tahti.live/c/artist#sound-item-sound-2',
            },
          },
          { ...baseEpisode, id: 'slot-3', note: 'Talk with guests' },
        ]}
      />,
    );

    expect(screen.getByText('Saturday set')).toBeTruthy();
    expect(screen.getByText('Talk with guests')).toBeTruthy();
    expect(
      screen.getAllByRole('link', { name: 'Listen to the recording' }),
    ).toHaveLength(1);
  });

  it('shows the empty message when there are no episodes', () => {
    render(
      <RadioShowEpisodeList
        emptyMessage="Nothing has aired yet."
        episodes={[]}
      />,
    );
    expect(screen.getByText('Nothing has aired yet.')).toBeTruthy();
  });
});
