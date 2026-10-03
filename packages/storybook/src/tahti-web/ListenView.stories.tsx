import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenView } from '@tahti-web/views/ListenView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof ListenView> = {
  title: 'Tahti/Listen/ListenView',
  component: ListenView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The home Listen page (`/`) with its Listen / Feed / History section tabs. Listen shows Tahti Radio, recently played, internet radio, On air channels, new tracks, listener widgets and the disco widgets; signed-in listeners also get the widget store.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withTahtiRouter('/')],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = within(
      await canvas.findByRole('tablist', { name: 'Listen sections' }),
    );

    await step('Listen dashboard sections render', async () => {
      const dashboard = within(await canvas.findByTestId('listen-dashboard'));
      for (const section of ['listen-on-air', 'listen-new-tracks']) {
        const [first] = await dashboard.findAllByTestId(section);
        await expect(first).toBeVisible();
      }
      await expect(
        await dashboard.findByRole('heading', { name: 'New tracks' }),
      ).toBeVisible();
    });

    await step('switch to Feed, History and back', async () => {
      await selectTab(tabs, /Feed/);
      await expect(
        await canvas.findByRole('heading', { level: 1, name: 'Feed' }),
      ).toBeVisible();
      await selectTab(tabs, /History/);
      await expect(
        await canvas.findByRole('heading', { level: 1, name: 'History' }),
      ).toBeVisible();
      await selectTab(tabs, /Listen/);
      await expect(await canvas.findByTestId('listen-dashboard')).toBeVisible();
    });
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null), withTahtiRouter('/')],
};

export const FeedTab: Story = {
  args: { tab: 'feed' },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/listen/feed'),
  ],
};

export const HistoryTab: Story = {
  args: { tab: 'history' },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/listen/history'),
  ],
};
