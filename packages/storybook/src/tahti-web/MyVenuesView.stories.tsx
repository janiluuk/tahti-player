import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyVenuesView } from '@tahti-web/views/MyVenuesView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof MyVenuesView> = {
  title: 'Tahti/Discover/MyVenuesView',
  component: MyVenuesView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`/venues/mine` - venues the signed-in user registered (`GET /api/me/venues`), each marked verified or waiting for the board.',
      },
    },
  },
  decorators: [withTahtiRouter('/venues/mine')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Northern Lights Hall' }),
    ).toBeVisible();
    await expect(canvas.getByText('Verified')).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Sign in to manage your venues'),
    ).toBeVisible();
  },
};
