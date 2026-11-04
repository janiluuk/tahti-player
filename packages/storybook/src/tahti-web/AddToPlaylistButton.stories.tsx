import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddToPlaylistButton } from '@tahti-web/components/AddToPlaylistButton';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AddToPlaylistButton> = {
  title: 'Tahti/Media/AddToPlaylistButton',
  component: AddToPlaylistButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/library'), withMockAuth()],
  args: {
    soundId: 'archive-item-1',
    trackTitle: 'Northern Lights — Aurora',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IconOnly: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Add to playlist' }),
    ).toBeInTheDocument();
  },
};

export const WithLabel: Story = {
  args: {
    iconOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Add to playlist' }),
    ).toBeInTheDocument();
  },
};

export const SecondaryVariant: Story = {
  args: {
    iconOnly: false,
    variant: 'secondary',
  },
};
