import type { Meta, StoryObj } from '@storybook/react-vite';
import { RandomTrackGenres } from '@tahti-web/components/discover/RandomTrackGenres';
import { WidgetCard } from '@tahti-web/components/discover/WidgetCard';
import { expect, waitFor, within } from 'storybook/test';

import { Select } from '@tahti-player/ui';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof WidgetCard> = {
  title: 'Tahti/Discover/WidgetCard',
  component: WidgetCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Every Discover widget renders through this panel: track lists (ranked or not), artist picks, latest releases, public playlists and the random track. Listings sit in an inset well with tiger-striped rows; the panel itself is raised with `shadow-float`. Intentionally not CardGrid - dense track rows via WidgetTrackRow, not media Card tiles.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/discover')],
  args: {
    onMove: () => {},
    onRemove: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const tracks = [
  {
    id: 'archive:track-1',
    title: 'Tundra Static',
    artist: 'Northern Lights',
    channelSlug: 'northern-lights',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
    listens: 4213,
  },
  {
    id: 'archive:track-2',
    title: 'Aurora Drift',
    artist: 'Kasari',
    channelSlug: 'kasari',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
    listens: 1892,
  },
];

export const RankedList: Story = {
  args: {
    id: 'this-week-most-played',
    title: 'Most played this week',
    loading: false,
    items: tracks,
    showRank: true,
    emptyMessage: 'No plays yet this week.',
    canMoveUp: false,
    canMoveDown: true,
  },
};

/** Each track row is its own hover group, so hovering one row reveals only
 * that row's play control (the card's hover only reveals its own header
 * actions). Holding Shift turns the play control into Add to queue. */
export const RowHoverAndShiftQueue: Story = {
  args: RankedList.args,
  play: async ({ canvasElement }) => {
    const [play] = within(canvasElement).getAllByTestId('media-artwork-play');
    const row = play.closest('a');
    await expect(row).toHaveClass('group');
    await expect(row?.parentElement?.closest('.group')).toBeNull();
    await expect(play).toHaveAttribute(
      'aria-label',
      'Play Tundra Static · Shift+click to queue',
    );

    window.dispatchEvent(new PointerEvent('pointermove', { shiftKey: true }));
    await waitFor(() =>
      expect(play).toHaveAttribute('aria-label', 'Add Tundra Static to queue'),
    );
    window.dispatchEvent(new PointerEvent('pointermove', { shiftKey: false }));
    await waitFor(() =>
      expect(play).toHaveAttribute(
        'aria-label',
        'Play Tundra Static · Shift+click to queue',
      ),
    );
  },
};

export const ArtistOfTheWeek: Story = {
  args: {
    id: 'artist-of-the-week',
    title: 'Artist of the week',
    loading: false,
    items: [],
    artist: {
      username: 'northern-lights',
      displayName: 'Northern Lights',
      bio: 'Ambient / downtempo, streaming most weeknights.',
      avatarUrl: null,
      channelSlug: 'northern-lights',
    },
    emptyMessage: 'No artist picked yet.',
    canMoveUp: true,
    canMoveDown: false,
  },
};

export const Loading: Story = {
  args: {
    id: 'latest-tracks',
    title: 'Latest tracks',
    loading: true,
    items: [],
    emptyMessage: 'No tracks yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const Empty: Story = {
  args: {
    id: 'loved',
    title: 'Loved',
    loading: false,
    items: [],
    emptyMessage: 'Love a track to see it here.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const LoadError: Story = {
  args: {
    id: 'latest-tracks',
    title: 'Latest tracks',
    loading: false,
    error: 'Server unavailable',
    onRetry: () => {},
    items: [],
    emptyMessage: 'No tracks yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

export const RandomArtistWithSettings: Story = {
  args: {
    id: 'random-artist',
    title: 'Random artist pick',
    loading: false,
    items: [],
    artist: {
      username: 'kasari',
      displayName: 'Kasari',
      bio: 'Downtempo electronica from Helsinki, live most Fridays.',
      avatarUrl: null,
      channelSlug: 'kasari',
    },
    emptyMessage: 'No artist picked yet.',
    canMoveUp: true,
    canMoveDown: true,
    settings: (
      <Select
        label="Keep the same pick for"
        value="7"
        onValueChange={() => {}}
        options={[
          { id: '1', label: '1 day' },
          { id: '3', label: '3 days' },
          { id: '7', label: '7 days' },
          { id: '14', label: '14 days' },
          { id: '30', label: '30 days' },
        ]}
      />
    ),
  },
};

export const PublicPlaylists: Story = {
  args: {
    id: 'public-playlists',
    title: 'Public playlists',
    loading: false,
    items: [],
    collections: [
      {
        slug: 'night-drive',
        name: 'Night drive selections',
        description: 'Warm synths and late-night movement.',
        coverUrl: null,
        itemCount: 12,
        ownerUsername: 'northern-lights',
        ownerDisplayName: 'Northern Lights',
      },
      {
        slug: 'weekend-radio',
        name: 'Weekend radio',
        description: 'A shared collection for slow Saturday mornings.',
        coverUrl: null,
        itemCount: 8,
        ownerUsername: 'kasari',
        ownerDisplayName: 'Kasari',
      },
    ],
    emptyMessage: 'No public playlists yet.',
    canMoveUp: false,
    canMoveDown: true,
  },
};

const moreTracks = [
  ...tracks,
  {
    id: 'archive:track-3',
    title: 'Polar Night',
    artist: 'Revontuli',
    channelSlug: 'revontuli',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
  },
  {
    id: 'archive:track-4',
    title: 'Saltwater',
    artist: 'Kasari',
    channelSlug: 'kasari',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
  },
  {
    id: 'archive:track-5',
    title: 'Low Sun',
    artist: 'Northern Lights',
    channelSlug: 'northern-lights',
    coverUrl: null,
    audioUrl: 'https://example.com/demo.mp3',
  },
];

/** Unranked track list (Latest tracks, New to you, Loved, Tahti Selects):
 * every other row is tinted so long lists scan easily. */
export const LatestTracksStriped: Story = {
  args: {
    id: 'latest-tracks',
    title: 'Latest tracks',
    loading: false,
    items: moreTracks,
    emptyMessage: 'No tracks yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
  play: async ({ canvasElement }) => {
    const rows = Array.from(
      within(canvasElement).getByTestId('widget-track-list').children,
    );
    await expect(rows).toHaveLength(5);
    const background = (index: number) =>
      getComputedStyle(rows[index] as HTMLElement).backgroundColor;
    await expect(background(1)).not.toBe(background(0));
    await expect(background(2)).toBe(background(0));
  },
};

export const LatestReleases: Story = {
  args: {
    id: 'latest-releases',
    title: 'Latest releases',
    loading: false,
    items: [],
    releases: [
      {
        id: 'rel-1',
        title: 'Aurora',
        type: 'EP',
        releaseDate: '2026-10-20',
        artworkUrl: null,
        smartLinkSlug: 'aurora',
        artistDisplayName: 'Northern Lights',
        artistUsername: 'northern-lights',
      },
      {
        id: 'rel-2',
        title: 'Harbour Lights',
        type: 'ALBUM',
        releaseDate: '2026-10-12',
        artworkUrl: null,
        smartLinkSlug: 'harbour-lights',
        artistDisplayName: 'Kasari',
        artistUsername: 'kasari',
      },
      {
        id: 'rel-3',
        title: 'First Frost',
        type: 'SINGLE',
        releaseDate: '2026-10-02',
        artworkUrl: null,
        smartLinkSlug: 'first-frost',
        artistDisplayName: 'Revontuli',
      },
    ],
    emptyMessage: 'No releases published yet.',
    canMoveUp: true,
    canMoveDown: true,
  },
};

/** Random track: one track from the chosen genres, genre pills and a
 * re-roll in the toolbar. */
export const RandomTrack: Story = {
  args: {
    id: 'random-track',
    title: 'Random track',
    loading: false,
    items: [moreTracks[2]],
    emptyMessage: 'No tracks in these genres yet.',
    canMoveUp: true,
    canMoveDown: true,
    toolbar: (
      <RandomTrackGenres
        genres={['Ambient', 'Downtempo']}
        onChange={() => {}}
        onShuffle={() => {}}
      />
    ),
  },
};
