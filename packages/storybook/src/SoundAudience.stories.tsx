import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { SoundAudience } from '@tahti-player/ui';

const avatar = (seed: string) => `https://picsum.photos/seed/${seed}/120/120`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const person = (
  id: string,
  name: string,
  meta?: string,
  withAvatar = true,
) => ({
  id,
  name,
  username: id,
  avatarUrl: withAvatar ? avatar(`tahti-${id}`) : null,
  href: `/u/${id}`,
  meta,
});

const meta = {
  title: 'Media/SoundAudience',
  component: SoundAudience,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sound page widget for tracks, sets and other sounds. Tabs from the left: **Collections** (public collections the sound is in), **Liked**, **Reposted** and **Played by** (people), each row with a thumbnail. People without an avatar get their initial. Rows link through `renderLink` (a router Link in tahti-web).',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
  args: {
    collections: [
      {
        id: 'c1',
        name: 'Night drives',
        coverUrl: cover('tahti-night'),
        href: '/collection/night-drives',
        meta: 'by Liina · 24 tracks',
      },
      {
        id: 'c2',
        name: 'Ambient for working',
        coverUrl: cover('tahti-ambient'),
        href: '/collection/ambient',
        meta: 'by Kaamos Crew · 61 tracks',
      },
      {
        id: 'c3',
        name: 'Tahti Selects: autumn',
        coverUrl: null,
        href: '/collection/selects-autumn',
        meta: 'by Tahti · 18 tracks',
      },
    ],
    likers: [
      person('liina', 'Liina', '2 days ago'),
      person('kaamos', 'Kaamos Crew', 'last week'),
      person('aurora', 'Aurora Drift', 'Oct 12', false),
      person('mart', 'Mart Saar', 'Oct 3'),
    ],
    reposters: [
      person('kaamos', 'Kaamos Crew', 'yesterday'),
      person('liis', 'Liis Kask', 'Oct 20'),
    ],
    listeners: [
      person('liina', 'Liina', 'Played 12×'),
      person('mart', 'Mart Saar', 'Played 4×'),
      person('aurora', 'Aurora Drift', 'Played 2×', false),
      person('moonlight', 'DJ Moonlight', 'Played once'),
      person('liis', 'Liis Kask', 'Played once'),
    ],
    counts: { likes: 38, plays: 214 },
    renderMore: (tab: string) => (
      <span className="text-foreground-secondary px-2 text-xs">
        Show all {tab}
      </span>
    ),
  },
} satisfies Meta<typeof SoundAudience>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Collections3',
      'Liked38',
      'Reposted2',
      'Played by214',
    ]);
    await expect(
      canvas.getAllByTestId('sound-audience-collection'),
    ).toHaveLength(3);
    await userEvent.click(canvas.getByRole('tab', { name: /Played by/ }));
    await waitFor(() =>
      expect(canvas.getAllByTestId('sound-audience-person')).toHaveLength(5),
    );
    await waitFor(() => expect(canvas.getByText('Played 12×')).toBeVisible());
  },
};

export const LikedTab: Story = { args: { defaultTab: 'likes' } };

export const RepostedTab: Story = { args: { defaultTab: 'reposts' } };

export const PlayedByTab: Story = { args: { defaultTab: 'plays' } };

/** A new sound: every tab says what will show up there. */
export const Empty: Story = {
  args: {
    collections: [],
    likers: [],
    reposters: [],
    listeners: [],
    counts: {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByText('Not in any public collection yet.'),
      ).toBeVisible(),
    );
  },
};
