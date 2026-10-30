import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipEditorDialog } from '@tahti-web/components/channel-clips/ClipEditorDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

const meta: Meta<typeof ClipEditorDialog> = {
  title: 'Tahti/Studio/ClipEditorDialog',
  component: ClipEditorDialog,
  args: {
    clip: {
      id: 'announcement-demo',
      title: 'Station ID',
      durationSec: 8,
      isEnabled: false,
      renderStatus: 'READY',
      contentType: 'CLIP',
    },
    programs: [
      {
        id: 'program-1',
        title: 'Evening selection',
        status: 'READY',
        durationSec: 3600,
        isFallback: true,
        fallbackOrder: 0,
      },
    ],
    onClose: fn(),
    onSaved: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const VocalPreview: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Edit clip');
    await userEvent.click(
      await dialog.findByRole('button', { name: 'Natural voice' }),
    );
    await userEvent.click(
      dialog.getByRole('button', { name: 'Generate preview' }),
    );
    await waitFor(() =>
      expect(
        dialog.getByText(
          'Preview ready. Listen to Processed, then save.',
          {},
          { timeout: 10000 },
        ),
      ).toBeVisible(),
    );
  },
};
export const MissingProgram: Story = {
  args: {
    clip: { ...meta.args!.clip!, placement: 'AFTER', targetSoundId: 'removed' },
  },
};
