import type { Meta, StoryObj } from '@storybook/react-vite';
import { LibraryView } from '@tahti-web/views/LibraryView';
import { expect, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta = {
  title: 'Tahti/Library/LibraryFavorites',
  component: LibraryView,
  args: { tab: 'favorites' },
  decorators: [withPageSurface(), withTahtiRouter('/library/favorites')],
} satisfies Meta<typeof LibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Favorites' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      canvas.getByRole('tab', { name: 'Sounds, needs an account' }),
    ).toBeDisabled();
    await expect(canvas.queryByText('Sign in to see favorites')).toBeNull();
    await expect(canvas.getByText('No favorite tracks')).toBeVisible();
  },
};

export const SignedIn: Story = {
  decorators: [withMockAuth()],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Favorites' }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tab', { name: 'Sounds' })).toBeEnabled();
  },
};
