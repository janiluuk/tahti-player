import type { Meta, StoryObj } from '@storybook/react-vite';
import { clearSnapshots } from '@tahti-web/lib/useSnapshotFetch';
import {
  useLibraryStore,
  type FavoritePlaylist,
} from '@tahti-web/stores/libraryStore';
import { LibraryView } from '@tahti-web/views/LibraryView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const SAVED_PLAYLISTS: FavoritePlaylist[] = [
  {
    slug: 'sauna-ambient',
    name: 'Sauna Ambient',
    ownerUsername: 'kaiku',
  },
  {
    slug: 'lakeside-dawn',
    name: 'Lakeside Dawn',
    ownerUsername: 'sumu',
  },
];

function withSavedPlaylists(favoritePlaylists: FavoritePlaylist[]) {
  return () => {
    clearSnapshots();
    const previous = useLibraryStore.getState().favoritePlaylists;
    useLibraryStore.setState({ favoritePlaylists });
    return () => {
      useLibraryStore.setState({ favoritePlaylists: previous });
    };
  };
}

const meta = {
  title: 'Tahti/Library/LibraryPlaylists',
  component: LibraryView,
  args: { tab: 'playlists' },
  parameters: {
    docs: {
      description: {
        component:
          'Library → Playlists: your own PLAYLIST and DJ_SET_SERIES collections under Yours, playlists saved from collection pages under Saved, one filter over both.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/library/playlists'),
  ],
  beforeEach: withSavedPlaylists(SAVED_PLAYLISTS),
} satisfies Meta<typeof LibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OwnAndSaved: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Playlists' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(await canvas.findByText('Yours')).toBeVisible();
    await expect(await canvas.findByText('Favorites mix')).toBeVisible();
    await expect(canvas.getByText('Northern Lights DJ set')).toBeVisible();
    await expect(canvas.queryByText('Midnight Archive')).toBeNull();
    await expect(canvas.getByText('Saved')).toBeVisible();
    await expect(canvas.getByText('Sauna Ambient')).toBeVisible();
    await expect(canvas.getByText('@kaiku')).toBeVisible();
  },
};

export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Favorites mix');
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Filter playlists' }),
      'sumu',
    );
    await expect(await canvas.findByText('Lakeside Dawn')).toBeVisible();
    await expect(canvas.queryByText('Sauna Ambient')).toBeNull();
    await expect(canvas.queryByText('Favorites mix')).toBeNull();
    await expect(canvas.queryByText('Yours')).toBeNull();
  },
};

export const FilterNoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Favorites mix');
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Filter playlists' }),
      'zzz',
    );
    await expect(
      await canvas.findByText('No matching playlists'),
    ).toBeVisible();
    await expect(canvas.queryByText('No playlists yet')).toBeNull();
  },
};

export const Empty: Story = {
  beforeEach: withSavedPlaylists([]),
  parameters: { mockData: mockData({ studioCollections: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('No playlists yet')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Create playlist' }),
    ).toHaveAttribute('href', '/studio/collections');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Sign in to see your playlists'),
    ).toBeVisible();
  },
};
