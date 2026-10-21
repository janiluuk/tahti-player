import type { Meta, StoryObj } from '@storybook/react-vite';
import { DownloadGateDialog } from '@tahti-web/views/track-detail/DownloadGateDialog';
import { expect, fn, userEvent } from 'storybook/test';

import { TRACK_ID } from './_fixtures/track-release';
import { findDialog } from './_lib/play';

const meta: Meta<typeof DownloadGateDialog> = {
  title: 'Tahti/Track/DownloadGateDialog',
  component: DownloadGateDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Opens from the track page\'s Download button when the artist requires a follow and/or a repost before the file downloads ("Require a follow" / "Require a repost" in the track editor\'s Sharing tab). Download unlocks once every step is done.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    gates: {
      followRequired: true,
      repostRequired: true,
      followSatisfied: false,
      repostSatisfied: false,
      canDownload: false,
    },
    channelSlug: 'northern-lights',
    soundId: TRACK_ID,
    artist: { username: 'northern-lights', displayName: 'Northern Lights' },
    signedIn: true,
    onClose: fn(),
    onDownload: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BothStepsPending: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Unlock this download');
    await expect(dialog.getByText('Follow Northern Lights')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Follow' })).toBeEnabled();
    await expect(
      dialog.getByRole('button', { name: 'Copy link' }),
    ).toBeEnabled();
    await expect(
      dialog.getByRole('button', { name: 'Download' }),
    ).toBeDisabled();
  },
};

export const FollowDone: Story = {
  args: {
    gates: {
      followRequired: true,
      repostRequired: true,
      followSatisfied: true,
      repostSatisfied: false,
      canDownload: false,
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Unlock this download');
    await expect(dialog.getByText('(done)')).toBeInTheDocument();
    await expect(dialog.queryByRole('button', { name: 'Follow' })).toBeNull();
  },
};

// Every step done: Download closes the dialog and starts the download.
export const Unlocked: Story = {
  args: {
    gates: {
      followRequired: true,
      repostRequired: true,
      followSatisfied: true,
      repostSatisfied: true,
      canDownload: true,
    },
  },
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Unlock this download');
    await userEvent.click(dialog.getByRole('button', { name: 'Download' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onDownload).toHaveBeenCalled();
  },
};

export const SignedOut: Story = {
  args: {
    signedIn: false,
    gates: {
      followRequired: true,
      repostRequired: false,
      followSatisfied: false,
      repostSatisfied: false,
      canDownload: false,
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Unlock this download');
    await expect(dialog.getByText('Sign in to follow')).toBeVisible();
    await expect(dialog.queryByRole('button', { name: 'Follow' })).toBeNull();
  },
};
