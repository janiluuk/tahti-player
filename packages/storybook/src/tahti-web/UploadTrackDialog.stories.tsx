import type { Meta, StoryObj } from '@storybook/react-vite';
import { UploadTrackDialog } from '@tahti-web/components/UploadTrackDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { audioFile, seedStudioSounds } from './_fixtures/track-release';
import { withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof UploadTrackDialog> = {
  title: 'Tahti/Track/UploadTrackDialog',
  component: UploadTrackDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/archive')],
  // The mock upload adds the new sound to the Studio mock store; seeding
  // nothing still snapshots the store and restores it afterwards.
  beforeEach: seedStudioSounds([]),
  args: {
    isOpen: true,
    onClose: fn(),
    onUploaded: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Upload track');
    await expect(dialog.getByRole('button', { name: 'Upload' })).toBeDisabled();
  },
};

// Pick a file, name it and upload: the dialog confirms and links to the
// new sound in Studio.
export const UploadFile: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Upload track');
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Title' }),
      'Polar Night',
    );
    await userEvent.upload(dialog.getByLabelText('Audio file'), audioFile());
    await expect(dialog.getByText('Choose another file')).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Upload' }));
    await expect(await dialog.findByRole('status')).toHaveTextContent(
      'Upload complete',
    );
    await waitFor(() =>
      expect(args.onUploaded).toHaveBeenCalledWith(
        expect.stringMatching(/^arch-mock-/),
      ),
    );
    await expect(
      dialog.getByRole('link', { name: 'Open in Music' }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/studio\/sounds\/arch-mock-/),
    );
  },
};
