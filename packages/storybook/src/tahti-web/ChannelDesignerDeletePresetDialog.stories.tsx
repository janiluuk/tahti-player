import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeletePresetDialog } from '@tahti-web/components/channel-designer/DeletePresetDialog';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { DESIGN_PRESETS } from './_fixtures/channel-design';
import { expectNoDialog, findDialog } from './_lib/play';

function DeletePresetDemo(args: ComponentProps<typeof DeletePresetDialog>) {
  const [target, setTarget] = useState(args.target);
  return (
    <DeletePresetDialog
      {...args}
      target={target}
      onClose={() => {
        setTarget(null);
        args.onClose();
      }}
      onConfirm={() => {
        args.onConfirm();
        setTarget(null);
      }}
    />
  );
}

const DIALOG_NAME = /Delete .Ember dusk.\?/;

/** Confirm before deleting a saved look. */
const meta: Meta<typeof DeletePresetDialog> = {
  title: 'Tahti/Channel/Designer/DeletePresetDialog',
  component: DeletePresetDialog,
  tags: ['autodocs'],
  args: {
    target: DESIGN_PRESETS[0] ?? null,
    presetBusy: false,
    onClose: fn(),
    onConfirm: fn(),
  },
  render: (args) => <DeletePresetDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmDelete: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await userEvent.click(
      dialog.getByRole('button', { name: 'Delete preset' }),
    );
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await expectNoDialog(canvasElement);
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const Deleting: Story = {
  name: 'Deleting (busy)',
  args: { presetBusy: true },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      dialog.getByRole('button', { name: 'Delete preset' }),
    ).toBeDisabled();
  },
};
