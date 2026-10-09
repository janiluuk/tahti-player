import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResetConfirmDialog } from '@tahti-web/components/channel-designer/ResetConfirmDialog';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { expectNoDialog, findDialog } from './_lib/play';

function ResetDemo(args: ComponentProps<typeof ResetConfirmDialog>) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  return (
    <ResetConfirmDialog
      {...args}
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        args.onClose();
      }}
      onConfirm={() => {
        args.onConfirm();
        setIsOpen(false);
      }}
    />
  );
}

/** Confirm before discarding unsaved designer changes. */
const meta: Meta<typeof ResetConfirmDialog> = {
  title: 'Tahti/Channel/Designer/ResetConfirmDialog',
  component: ResetConfirmDialog,
  tags: ['autodocs'],
  args: { isOpen: true, onClose: fn(), onConfirm: fn() },
  render: (args) => <ResetDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmReset: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Reset unsaved changes?');
    await userEvent.click(dialog.getByRole('button', { name: 'Reset' }));
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await expectNoDialog(canvasElement);
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Reset unsaved changes?');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};
