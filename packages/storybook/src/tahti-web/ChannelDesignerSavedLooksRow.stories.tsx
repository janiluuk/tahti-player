import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavedLooksRow } from '@tahti-web/components/channel-designer/SavedLooksRow';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DESIGN_PRESETS } from './_fixtures/channel-design';

/** Saved-look chips above the designer preview. Renders nothing until the
 * owner has saved at least one preset. */
const meta: Meta<typeof SavedLooksRow> = {
  title: 'Tahti/Channel/Designer/SavedLooksRow',
  component: SavedLooksRow,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    presets: DESIGN_PRESETS,
    presetBusy: false,
    onApply: fn(),
    onRequestDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPresets: Story = {
  name: 'Two saved looks',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Ember dusk' }));
    await expect(args.onApply).toHaveBeenCalledWith(DESIGN_PRESETS[0]);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete "Violet hour"' }),
    );
    await expect(args.onRequestDelete).toHaveBeenCalledWith(DESIGN_PRESETS[1]);
  },
};

export const Busy: Story = {
  name: 'Busy (save or delete in flight)',
  args: { presetBusy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Ember dusk' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Delete "Ember dusk"' }),
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  name: 'No saved looks (renders nothing)',
  args: { presets: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('Saved looks')).toBeNull();
  },
};
