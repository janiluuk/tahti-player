import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createNewsPost,
  deleteNewsPost,
  fetchAdminNews,
} from '@tahti-web/api/admin';
import { LatestNewsWidget } from '@tahti-web/components/LatestNewsWidget';
import { useListenerWidgetsStore } from '@tahti-web/stores/listenerWidgetsStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { findDialog } from './_lib/play';

const seedSources = () => {
  useListenerWidgetsStore.setState({
    installedTypeIds: ['news'],
    instances: [
      {
        id: 'djmag',
        typeId: 'news',
        input: 'https://djmag.com/rss.xml',
        label: 'DJ Mag',
        addedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'cdm',
        typeId: 'news',
        input: 'https://cdm.link/feed/',
        label: 'CDM',
        addedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  });
};

const meta: Meta<typeof LatestNewsWidget> = {
  title: 'Tahti/Listen/LatestNewsWidget',
  component: LatestNewsWidget,
  args: { surface: 'listen' },
  parameters: {
    docs: {
      description: {
        component:
          'Every News add-on feed on the page merged into one **Latest News** row of `StoryCard`s, newest first (shown on Listen and in Feed). **Sources** adds and removes feeds (suggested DJ and production feeds, or any RSS / Atom URL); **more News** lists every merged headline; a card opens the article in `FeedStoryDialog`. Board members get edit (shared `PlatformNewsEditDialog`) and remove (red `ConfirmDialog`, removed from the list only after the API succeeds) actions on Tahti platform news cards, in the More news list and in the article dialog; RSS items have none.',
      },
    },
  },
  decorators: [
    (Story) => {
      seedSources();
      return <Story />;
    },
    withPageSurface(),
    withTahtiRouter('/'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = await canvas.findAllByTestId('news-story');
    await expect(cards.length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole('button', { name: /Sources/ }));
    const body = within(document.body);
    const list = await body.findByRole('list', { name: 'Your sources' });
    await expect(within(list).getByText('DJ Mag')).toBeVisible();
    await expect(within(list).getByText('CDM')).toBeVisible();
  },
};

const TEMP_HEADLINE = 'Storybook: board post';

/** A throwaway published post on the mock news store, so editing and
 * removing never touch the seed posts other stories read. */
async function seedTempPost() {
  await createNewsPost({
    headline: TEMP_HEADLINE,
    summary: 'A post the board can edit or remove.',
    publish: true,
  });
  return async () => {
    const { data } = await fetchAdminNews();
    for (const post of data) {
      if (post.headline.startsWith('Storybook:')) {
        await deleteNewsPost(post.id);
      }
    }
  };
}

export const BoardEditsPost: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
  beforeEach: seedTempPost,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: `Edit “${TEMP_HEADLINE}”` }),
    );
    const dialog = await findDialog(canvasElement, 'Edit article');
    const headline = dialog.getByLabelText('Headline');
    await userEvent.clear(headline);
    await userEvent.type(headline, 'Storybook: edited post');
    await userEvent.click(dialog.getByRole('button', { name: 'Save article' }));
    await waitFor(() =>
      expect(canvas.getByText('Storybook: edited post')).toBeVisible(),
    );
    await expect(canvas.queryByText(TEMP_HEADLINE)).toBeNull();
  },
};

export const BoardRemovesPost: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
  beforeEach: seedTempPost,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const remove = await canvas.findByRole('button', {
      name: `Remove “${TEMP_HEADLINE}”`,
    });
    await step('cancel keeps the post', async () => {
      await userEvent.click(remove);
      const dialog = await findDialog(
        canvasElement,
        `Remove “${TEMP_HEADLINE}”?`,
      );
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      await expect(canvas.getByText(TEMP_HEADLINE)).toBeVisible();
    });
    await step('confirm removes it', async () => {
      await userEvent.click(remove);
      const dialog = await findDialog(
        canvasElement,
        `Remove “${TEMP_HEADLINE}”?`,
      );
      await userEvent.click(dialog.getByRole('button', { name: 'Remove' }));
      await waitFor(() => expect(canvas.queryByText(TEMP_HEADLINE)).toBeNull());
    });
  },
};

export const ListenerSeesNoAdminActions: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findAllByTestId('news-story');
    await expect(canvas.queryByTestId('news-edit')).toBeNull();
    await expect(canvas.queryByTestId('news-remove')).toBeNull();
  },
};
