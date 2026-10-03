import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import { AccentPairFields } from '@tahti-web/components/channel-designer/AccentPairFields';
import { useState } from 'react';
import { expect, fireEvent, fn, within } from 'storybook/test';

import { DESIGN_SCHEME } from './_fixtures/channel-design';

/** Accent + highlight pickers shown for the Solid, Video and Slideshow
 * header styles. */
const meta: Meta<typeof AccentPairFields> = {
  title: 'Tahti/Channel/Designer/AccentPairFields',
  component: AccentPairFields,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { scheme: DESIGN_SCHEME, onChange: fn() },
  render: function Render(args) {
    const [scheme, setScheme] = useState<ColorScheme>(args.scheme);
    return (
      <div className="max-w-xs">
        <AccentPairFields
          scheme={scheme}
          onChange={(next) => {
            setScheme(next);
            args.onChange(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const accent = canvas.getByLabelText('Accent');
    await expect(accent).toHaveValue('#22d3ee');
    fireEvent.change(accent, { target: { value: '#f97316' } });
    await expect(accent).toHaveValue('#f97316');
    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accent: '#f97316', highlight: '#A78BFA' }),
    );
  },
};

export const EmptyScheme: Story = {
  name: 'Empty scheme (falls back to defaults)',
  args: { scheme: {} },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByLabelText('Highlight'),
    ).not.toHaveValue('');
  },
};
