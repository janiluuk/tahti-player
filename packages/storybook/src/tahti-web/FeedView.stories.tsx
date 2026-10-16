import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeedView } from '@tahti-web/views/FeedView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof FeedView> = {
  title: 'Tahti/Social/FeedView',
  component: FeedView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Personal timeline at `/feed` of posts, tracks, and releases from artists you follow.',
      },
    },
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    withTahtiRouter('/feed'),
    (Story) => (
      <div className="w-[390px] max-w-full overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PopulatedPhone: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByRole('heading', { name: 'Feed' }));
    await expect(
      await canvas.findByText('Thursday show moved an hour later'),
    ).toBeVisible();
  },
};

export const SignedOutEmptyPhone: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Sign in to see your feed'));
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
  },
};
