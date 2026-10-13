import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppliedPresetBanner } from '@tahti-web/components/channel-designer/AppliedPresetBanner';
import { expect, fn, userEvent, within } from 'storybook/test';

/** Shown after a saved look is applied: keep it, or revert to the last save. */
const meta: Meta<typeof AppliedPresetBanner> = {
  title: 'Tahti/Channel/Designer/AppliedPresetBanner',
  component: AppliedPresetBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { presetName: 'Ember dusk', onRevert: fn(), onKeep: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ember dusk/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Revert' }));
    await expect(args.onRevert).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole('button', { name: 'Keep' }));
    await expect(args.onKeep).toHaveBeenCalledOnce();
  },
};

export const LongName: Story = {
  name: 'Long preset name (wraps)',
  args: {
    presetName: 'Late-night ambient set with the violet aurora palette',
  },
};
