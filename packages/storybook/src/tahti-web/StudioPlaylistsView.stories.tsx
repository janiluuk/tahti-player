import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StudioCollection } from '@tahti-web/api/studio-types';
import { StudioPlaylistsView } from '@tahti-web/views/studio/StudioPlaylistsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectNoDialog, expectVisible, findDialog } from './_lib/play';

/** The shared mocks have one playlist; add a collaborative and a private one. */
function withMorePlaylists(base: StudioCollection[]): StudioCollection[] {
  const template = base.find((row) => row.style === 'PLAYLIST') ?? base[0]!;
  return [
    ...base,
    {
      ...template,
      id: 'mock-collection-sauna',
      slug: 'sauna-warmup',
      name: 'Sauna warm-up',
      collaborative: true,
      itemCount: 14,
    },
    {
      ...template,
      id: 'mock-collection-demos',
      slug: 'unreleased-demos',
      name: 'Unreleased demos',
      isPublic: false,
      collaborative: false,
      itemCount: 3,
    },
  ];
}

const meta: Meta<typeof StudioPlaylistsView> = {
  title: 'Tahti/Studio/StudioPlaylistsView',
  component: StudioPlaylistsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Playlists: the library section tabs, a Collections / Playlists switch, every playlist (albums, EPs and DJ sets stay under Collections) with public or private, collaborative and item count, an Edit link each, and the "New playlist" dialog.',
      },
    },
    mockData: mockData({ studioCollections: withMorePlaylists }),
  },
  decorators: [
    withTahtiRouter('/studio/playlists'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: 'Favorites mix' }),
    ).toHaveAttribute('href', '/studio/collections/favorites-mix');
    await expectVisible(canvas.getByRole('link', { name: 'Sauna warm-up' }));
    await expectVisible(canvas.getByText('Collaborative'));
    await expectVisible(canvas.getByText('Private'));
    await expect(canvas.queryByText('Midnight Archive')).toBeNull();
    await expect(canvas.getAllByRole('link', { name: 'Edit' })).toHaveLength(3);
    await expect(
      canvas.getByRole('link', { name: 'Collections' }),
    ).toHaveAttribute('href', '/studio/collections');
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ studioCollections: () => [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('No playlists yet'));
    await expect(
      canvas.getAllByRole('button', { name: 'New playlist' }),
    ).toHaveLength(2);
  },
};

// A private playlist can't be collaborative.
export const CreatePlaylist: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Favorites mix' });
    await userEvent.click(canvas.getByRole('button', { name: 'New playlist' }));
    const dialog = await findDialog(canvasElement, 'New playlist');
    const create = dialog.getByRole('button', { name: 'Create' });
    await expect(create).toBeDisabled();

    const collaborative = dialog.getByRole('switch', {
      name: 'Others can add tracks',
    });
    await userEvent.click(collaborative);
    await expect(collaborative).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(
      dialog.getByRole('switch', { name: 'Public on profile' }),
    );
    await waitFor(() =>
      expect(collaborative).toHaveAttribute('aria-checked', 'false'),
    );
    await expect(collaborative).toBeDisabled();

    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Name' }),
      'Night drive',
    );
    await userEvent.click(create);
    await expectNoDialog(canvasElement);
  },
};
