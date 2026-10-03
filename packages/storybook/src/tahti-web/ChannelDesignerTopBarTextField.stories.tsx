import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopBarTextField } from '@tahti-web/components/channel-designer/TopBarTextField';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

/** Backdrop panel: the short line shown in a strip across the channel hero. */
const meta: Meta<typeof TopBarTextField> = {
  title: 'Tahti/Channel/Designer/TopBarTextField',
  component: TopBarTextField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 'New album "Polar Drift" out Friday', onChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="max-w-sm">
        <TopBarTextField
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByLabelText('Top bar text');
    await expect(input).toHaveValue('New album "Polar Drift" out Friday');
    await expect(input).toHaveAttribute('maxlength', '120');
    await userEvent.clear(input);
    await userEvent.type(input, 'Live tonight 21:00');
    await expect(input).toHaveValue('Live tonight 21:00');
    await expect(args.onChange).toHaveBeenLastCalledWith('Live tonight 21:00');
  },
};

export const Empty: Story = {
  args: { value: '' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByPlaceholderText('e.g. New album out Friday'),
    ).toHaveValue('');
  },
};
