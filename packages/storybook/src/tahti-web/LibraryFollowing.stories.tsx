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
  title: 'Tahti/Library/LibraryHistory',
  component: LibraryView,
  args: { tab: 'history' },
  parameters: {
    docs: {
      description: {
        component:
          'Library → History: what you listened to. Following moved to Settings → Artist (Profile) → Following.',
      },
    },
  },
  decorators: [withPageSurface(), withTahtiRouter('/library/history')],
} satisfies Meta<typeof LibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const History: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};
