import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollaborativePlaylistAdd } from '@tahti-web/components/CollaborativePlaylistAdd';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Toaster } from '@tahti-player/ui';

import { COLLECTION_SLUG } from './_fixtures/collection';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { withinBody } from './_lib/play';

const meta: Meta<typeof CollaborativePlaylistAdd> = {
  title: 'Tahti/Collection/CollaborativePlaylistAdd',
  component: CollaborativePlaylistAdd,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The "Add to this playlist" panel on a collaborative public playlist: an optional note plus a catalog search. Tracks already in the playlist are filtered out of the results; signed-out visitors get a sign-in link instead.',
      },
    },
  },
  args: {
    slug: COLLECTION_SLUG,
    existingSoundIds: ['catalog-mock-3'],
    onAdded: fn(),
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
    withTahtiRouter(`/u/northern-lights/c/${COLLECTION_SLUG}`),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AddWithNote: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const note = canvas.getByLabelText('Note (optional)');
    await userEvent.type(note, 'For the ferry ride');
    await userEvent.type(canvas.getByLabelText('Search the catalog'), 'Mid');
    const results = within(
      await canvas.findByRole('list', { name: 'Catalog results' }),
    );
    await userEvent.click(
      results.getByRole('button', { name: 'Add Midnight Ferry by Aino' }),
    );
    await waitFor(() => expect(args.onAdded).toHaveBeenCalledOnce());
    const toast = await withinBody(canvasElement).findByText(
      'Added Midnight Ferry.',
    );
    // Sonner fades toasts in, so visibility settles after mount.
    await waitFor(() => expect(toast).toBeVisible());
    await expect(note).toHaveValue('');
  },
};

// "Frost Lines" is already in the playlist, so the search finds nothing new.
export const ExistingTrackHidden: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Search the catalog'), 'Frost');
    await expect(
      await canvas.findByText('No public tracks match “Frost”.'),
    ).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: 'Sign in' }),
    ).toHaveAttribute('href', '/login');
  },
};
