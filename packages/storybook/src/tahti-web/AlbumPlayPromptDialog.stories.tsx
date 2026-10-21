import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlbumPlayPromptDialog } from '@tahti-web/components/artist-view';
import { expect, fn, userEvent } from 'storybook/test';

import { findDialog } from './_lib/play';

const meta: Meta<typeof AlbumPlayPromptDialog> = {
  title: 'Tahti/Artist/AlbumPlayPromptDialog',
  component: AlbumPlayPromptDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Asked when an album is played from the artist page while something is already queued: add it to the end of the queue, or play it now.',
      },
    },
  },
  args: {
    title: 'Polar Static',
    onClose: fn(),
    onQueue: fn(),
    onPlayNow: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const QueueAlbum: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Play Polar Static?');
    await userEvent.click(dialog.getByRole('button', { name: 'Queue album' }));
    await expect(args.onQueue).toHaveBeenCalledOnce();
  },
};

export const PlayNow: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Play Polar Static?');
    await userEvent.click(dialog.getByRole('button', { name: 'Play now' }));
    await expect(args.onPlayNow).toHaveBeenCalledOnce();
  },
};

export const Closed: Story = {
  args: { title: null },
};
