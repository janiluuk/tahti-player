import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { CollectionView } from '@tahti-web/views/CollectionView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  COLLECTION_NAME,
  COLLECTION_SLUG,
  collectionCollaborativeData,
  collectionEmptyData,
  collectionPrivateData,
} from './_fixtures/collection';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof CollectionView> = {
  title: 'Tahti/Collection/CollectionView',
  component: CollectionView,
  parameters: {
    layout: 'padded',
    mockData: collectionCollaborativeData,
    docs: {
      description: {
        component:
          'The public playlist page at `/u/$username/c/$slug`: header (play, queue all, embed, RSS, Jam, favorite, subscribe, report), track table with "Added by" + note lines on collaborative playlists, embed-only rows under "Elsewhere", linked releases and the add-a-track panel for collaborative public playlists. Fixtures live in `_fixtures/collection.ts`.',
      },
    },
  },
  args: { slug: COLLECTION_SLUG },
  decorators: [withTahtiRouter(`/u/northern-lights/c/${COLLECTION_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function findCollection(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { level: 1, name: COLLECTION_NAME });
  return canvas;
}

export const CollaborativeVisitor: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement, step }) => {
    const canvas = await findCollection(canvasElement);

    await step(
      'contribution lines credit other people by username',
      async () => {
        const lines = canvas.getAllByTestId('collection-contribution');
        await expect(lines).toHaveLength(3);
        await expect(lines[0]).toHaveTextContent('“Where it all started.”');
        await expect(lines[1]).toHaveTextContent(
          'Added by @listener-liina · “Perfect for the 3am bus home”',
        );
        await expect(
          within(lines[2]!).getByRole('link', { name: '@dj-moonlight' }),
        ).toHaveAttribute('href', '/u/dj-moonlight');
      },
    );

    await step('header actions for a visitor', async () => {
      await expect(canvas.getByText(/\(collaborative\)/)).toBeVisible();
      await expect(
        canvas.getByRole('button', {
          name: `Copy the RSS feed of ${COLLECTION_NAME}`,
        }),
      ).toBeVisible();
      await expect(
        canvas.queryByRole('link', { name: 'Edit in Studio' }),
      ).toBeNull();
    });

    await step('favorite toggles pressed state', async () => {
      const [favorite] = canvas.getAllByRole('button', {
        name: 'Favorite',
        pressed: false,
      });
      await userEvent.click(favorite!);
      await waitFor(() =>
        expect(
          canvas.getAllByRole('button', { name: 'Favorited', pressed: true }),
        ).not.toHaveLength(0),
      );
      await userEvent.click(
        canvas.getAllByRole('button', { name: 'Favorited' })[0]!,
      );
    });

    await step('Play starts the first track', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Play' }));
      await waitFor(() =>
        expect(usePlayerStore.getState().currentId).toBe(
          'sound:northern-lights-archive-1',
        ),
      );
    });

    await step('embed-only rows, linked releases and add panel', async () => {
      await expect(canvas.getByText('Elsewhere')).toBeVisible();
      await expect(
        canvas.getByRole('link', { name: 'Polar Static' }),
      ).toHaveAttribute('href', '/r/northern-lights-release-2');
      await expect(
        canvas.getByRole('region', { name: 'Add to this playlist' }),
      ).toBeVisible();
    });

    await step('report dialog opens and cancels', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: `Report ${COLLECTION_NAME}` }),
      );
      const dialog = await findDialog(
        canvasElement,
        `Report ${COLLECTION_NAME}`,
      );
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      await expectNoDialog(canvasElement);
    });
  },
};

export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = await findCollection(canvasElement);
    await expect(
      canvas.getByRole('link', { name: 'Edit in Studio' }),
    ).toHaveAttribute('href', `/studio/collections/${COLLECTION_SLUG}`);
    await expect(
      canvas.queryByRole('button', { name: `Report ${COLLECTION_NAME}` }),
    ).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Favorite' })).toBeNull();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = await findCollection(canvasElement);
    const add = within(
      canvas.getByRole('region', { name: 'Add to this playlist' }),
    );
    await expect(add.getByRole('link', { name: 'Sign in' })).toBeVisible();
  },
};

export const Private: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: collectionPrivateData },
  play: async ({ canvasElement }) => {
    const canvas = await findCollection(canvasElement);
    await expect(canvas.queryByRole('button', { name: /RSS feed/ })).toBeNull();
    await expect(
      canvas.queryByRole('button', { name: `Report ${COLLECTION_NAME}` }),
    ).toBeNull();
    await expect(
      canvas.queryByRole('region', { name: 'Add to this playlist' }),
    ).toBeNull();
  },
};

export const Empty: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: collectionEmptyData },
  play: async ({ canvasElement }) => {
    const canvas = await findCollection(canvasElement);
    await expect(canvas.getByText('No tracks in this playlist')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeDisabled();
  },
};
