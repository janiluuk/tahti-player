import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CollectionPlayer } from '@tahti-player/ui';

const TRACKS = [
  {
    id: 't1',
    title: 'Nightriders vol. 43 - Set of melodic trance @ Kalamaja, 11/2025',
    durationLabel: '36:59',
  },
  {
    id: 't2',
    title: 'Producer set of Trance @ Nightclub Wenla, Helsinki, 17.02.24',
    durationLabel: '1:53:03',
  },
  {
    id: 't3',
    title:
      'Upbeat progressive set @ Suvilahti, Helsinki - Burning Man event, 08.04.2023',
    durationLabel: '1:02:04',
  },
  {
    id: 't4',
    title: 'Warmup set @ Eiranranta, Lots of own mashups & remixes! :)',
    durationLabel: '1:10:29',
  },
  {
    id: 't5',
    title:
      'Pride Set @ Club Vabank Freedom Square, Tallinn, Estonia, June 2017',
    durationLabel: '1:08:51',
  },
];

const meta = {
  title: 'Media/CollectionPlayer',
  component: CollectionPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A collection widget that plays in place: stacked cover, title, kind · sound count · likes, a round **play all** button and an optional edit button. Hovering a row turns its number into a play button; the playing row is highlighted (and pauses on click). **Show all** appears when the list shows only part of the collection. Colours come from the theme tokens.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'Recorded sets from gigs',
    coverUrl: 'https://picsum.photos/seed/tahti-gig/320/320',
    kindLabel: 'Set',
    trackCount: 178,
    likeCount: 2,
    tracks: TRACKS,
    onPlayAll: fn(),
    onPlayTrack: fn(),
    onEdit: fn(),
    renderShowAll: (label, children) => (
      <a href="#all" aria-label={label} className="rounded-lg">
        {children}
      </a>
    ),
  },
} satisfies Meta<typeof CollectionPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('178 Sounds')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Play Recorded sets from gigs' }),
    );
    await expect(args.onPlayAll).toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole('button', { name: /^Play Warmup set/ }),
    );
    await expect(args.onPlayTrack).toHaveBeenCalledWith(3);
    await expect(
      canvas.getByRole('link', { name: 'Show all 178 Sounds' }),
    ).toBeVisible();
  },
};

/** Stateful: play all, play a row, pause from the row or the big button. */
export const Interactive: Story = {
  render: function Render(args) {
    const [current, setCurrent] = useState<string | null>('t4');
    const [playing, setPlaying] = useState(true);
    return (
      <CollectionPlayer
        {...args}
        currentTrackId={current}
        isPlaying={playing}
        onPlayAll={() => {
          setCurrent(TRACKS[0].id);
          setPlaying(true);
        }}
        onPlayTrack={(index) => {
          setCurrent(TRACKS[index].id);
          setPlaying(true);
        }}
        onTogglePlayback={() => setPlaying((value) => !value)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByTestId('collection-player-row');
    await expect(rows[3]).toHaveAttribute('aria-current', 'true');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Pause Recorded sets from gigs' }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Play Recorded sets from gigs' }),
    ).toBeVisible();
    await userEvent.click(rows[1]);
    await expect(
      canvas.getAllByTestId('collection-player-row')[1],
    ).toHaveAttribute('aria-current', 'true');
  },
};

export const Empty: Story = {
  args: { tracks: [], trackCount: 0, likeCount: undefined, onEdit: undefined },
};
