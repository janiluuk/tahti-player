import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavePresetDialog } from '@tahti-web/components/channel-designer/SavePresetDialog';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { expectNoDialog, findDialog } from './_lib/play';

function SavePresetDemo(args: ComponentProps<typeof SavePresetDialog>) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const [name, setName] = useState(args.presetNameInput);
  return (
    <SavePresetDialog
      {...args}
      isOpen={isOpen}
      presetNameInput={name}
      onNameChange={(value) => {
        setName(value);
        args.onNameChange(value);
      }}
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

/** "Save preset" dialog from the designer's more-options menu. */
const meta: Meta<typeof SavePresetDialog> = {
  title: 'Tahti/Channel/Designer/SavePresetDialog',
  component: SavePresetDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    presetBusy: false,
    presetNameInput: '',
    onNameChange: fn(),
    onClose: fn(),
    onConfirm: fn(),
  },
  render: (args) => <SavePresetDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NameAndSave: Story = {
  name: 'Name a preset and save',
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Save preset');
    await userEvent.type(dialog.getByLabelText('Preset name'), 'Neon night');
    await expect(args.onNameChange).toHaveBeenLastCalledWith('Neon night');
    await userEvent.click(dialog.getByRole('button', { name: 'Save preset' }));
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await expectNoDialog(canvasElement);
  },
};

export const Cancel: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Save preset');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expectNoDialog(canvasElement);
  },
};

export const Saving: Story = {
  name: 'Saving (busy)',
  args: { presetBusy: true, presetNameInput: 'Neon night' },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Save preset');
    await expect(
      dialog.getByRole('button', { name: 'Save preset' }),
    ).toBeDisabled();
  },
};
