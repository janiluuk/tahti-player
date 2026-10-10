import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AdminAnnouncementClip } from '@tahti-web/api/admin';
import { AnnouncementTrimDialog } from '@tahti-web/views/admin/announcements/AnnouncementTrimDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

/** Matches `ann-1` in the offline announcement fixtures (12 s, has audio). */
const WELCOME_CLIP: AdminAnnouncementClip = {
  id: 'ann-1',
  title: 'Welcome to Tahti',
  durationSec: 12,
  isEnabled: true,
  scheduleMode: 'AFTER_EVERY',
  everyNth: null,
};

const meta: Meta<typeof AnnouncementTrimDialog> = {
  title: 'Tahti/Admin/AdminAnnouncementTrimDialog',
  component: AnnouncementTrimDialog,
  tags: ['autodocs'],
  args: {
    clip: WELCOME_CLIP,
    onClose: fn(),
    onRendered: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DIALOG_NAME = 'Trim Welcome to Tahti';

/** Loads the original upload and prefills the full clip length. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      await dialog.findByLabelText('Original upload of Welcome to Tahti'),
    ).toBeInTheDocument();
    await expect(dialog.getByLabelText('Start (s)')).toHaveValue(0);
    await expect(dialog.getByLabelText('End (s)')).toHaveValue(12);
    await expect(dialog.getByText('The original is 12 s long.')).toBeVisible();

    await userEvent.click(dialog.getByRole('button', { name: 'Render trim' }));
    await waitFor(() => expect(args.onRendered).toHaveBeenCalled());
  },
};

/** Trims are checked against the clip before anything is rendered. */
export const InvalidTrim: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await dialog.findByLabelText('Original upload of Welcome to Tahti');

    const end = dialog.getByLabelText('End (s)');
    await userEvent.clear(end);
    await userEvent.type(end, '20');
    await userEvent.click(dialog.getByRole('button', { name: 'Render trim' }));
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      "End can't be past the clip's length (12 s).",
    );

    await userEvent.clear(end);
    await userEvent.type(end, '4');
    const fadeIn = dialog.getByLabelText('Fade in (s)');
    await userEvent.clear(fadeIn);
    await userEvent.type(fadeIn, '5');
    await userEvent.click(dialog.getByRole('button', { name: 'Render trim' }));
    await expect(dialog.getByRole('alert')).toHaveTextContent(
      'The fades are longer than the trimmed clip.',
    );
    await expect(args.onRendered).not.toHaveBeenCalled();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

/** A clip with no stored upload (`ann-2`) can't be trimmed. */
export const MissingUpload: Story = {
  args: {
    clip: {
      ...WELCOME_CLIP,
      id: 'ann-2',
      title: 'AGM reminder — October',
      durationSec: 8,
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(
      canvasElement,
      'Trim AGM reminder — October',
    );
    await expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Announcement not found',
    );
    await expect(dialog.queryByText('Loading the original upload…')).toBeNull();
  },
};
