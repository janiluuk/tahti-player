import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioFansView } from '@tahti-web/views/studio/StudioFansView';
import { StudioProfileView } from '@tahti-web/views/studio/StudioProfileView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Studio/Hubs',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio sections that are hubs instead of a second row of tabs: **Fans** (posts, newsletter, memberships, store, earnings) and **Profile** (artist profile and channel page settings). Each card opens a focused page.',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

export const Fans: Story = {
  decorators: [withTahtiRouter('/studio/fans')],
  render: () => <StudioFansView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Fans' }),
    ).toBeVisible();
    const links = within(
      canvas.getByRole('list', { name: 'Fans tools' }),
    ).getAllByRole('link');
    await expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/studio/updates',
      '/studio/updates?tab=newsletter',
      '/studio/audience?tab=tiers',
      '/studio/audience?tab=store',
      '/studio/audience',
    ]);
  },
};

export const Profile: Story = {
  decorators: [withTahtiRouter('/studio/profile')],
  render: () => <StudioProfileView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Profile' }),
    ).toBeVisible();
    const artist = within(
      canvas.getByRole('list', { name: 'Artist profile settings' }),
    ).getAllByRole('link');
    await expect(artist).toHaveLength(8);
    await expect(artist[0]).toHaveAttribute(
      'href',
      '/settings/artist?tab=identity',
    );
    const channel = within(
      canvas.getByRole('list', { name: 'Channel page settings' }),
    ).getAllByRole('link');
    await expect(channel[0]).toHaveTextContent('Channel design');
  },
};
