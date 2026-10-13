import type { Meta, StoryObj } from '@storybook/react-vite';
import { CronHistoryDialog } from '@tahti-web/views/admin/status/CronHistoryDialog';
import { expect, fn, userEvent } from 'storybook/test';

import { findDialog } from './_lib/play';

const meta: Meta<typeof CronHistoryDialog> = {
  title: 'Tahti/Admin/AdminCronHistoryDialog',
  component: CronHistoryDialog,
  tags: ['autodocs'],
  args: {
    jobName: 'radio-rotation-refresh',
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Admin → Status → a cron job's recent runs, with the failed one's error. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const dialog = await findDialog(
      canvasElement,
      'radio-rotation-refresh runs',
    );
    await expect(await dialog.findByText('3 runs, 1 failed.')).toBeVisible();
    await expect(dialog.getAllByRole('listitem')).toHaveLength(3);
    await expect(dialog.getAllByText('SUCCESS')).toHaveLength(2);
    await expect(dialog.getByText('ERROR')).toBeVisible();
    await expect(dialog.getByText('Timed out after 30 s')).toBeVisible();
    await expect(dialog.getAllByText('1.2 s')).toHaveLength(3);

    await userEvent.click(dialog.getByTestId('dialog-close'));
    await expect(args.onClose).toHaveBeenCalled();
  },
};
