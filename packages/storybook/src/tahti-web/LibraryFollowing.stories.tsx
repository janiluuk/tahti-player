import type { Meta, StoryObj } from '@storybook/react-vite';
import { LibraryView } from '@tahti-web/views/LibraryView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta = {
  title: 'Tahti/Library/LibraryFollowing',
  component: LibraryView,
  args: { tab: 'following' },
  parameters: {
    docs: {
      description: {
        component:
          'Library → Following: the artists and channels you follow, each linking to their page. Library → History shows what you listened to.',
      },
    },
  },
  decorators: [withPageSurface(), withTahtiRouter('/library/following')],
} satisfies Meta<typeof LibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Listener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Following' }),
    ).toHaveAttribute('aria-selected', 'true');
    const list = await canvas.findByTestId('library-following');
    await expect(
      (await within(list).findAllByRole('link')).length,
    ).toBeGreaterThan(0);
  },
};

export const History: Story = {
  args: { tab: 'history' },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/library/history'),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};
