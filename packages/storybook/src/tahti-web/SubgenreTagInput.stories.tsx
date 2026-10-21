import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubgenreTagInput } from '@tahti-web/components/SubgenreTagInput';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof SubgenreTagInput> = {
  title: 'Tahti/Track/SubgenreTagInput',
  component: SubgenreTagInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A sound's sub-genres (up to 12), listed after the main genre in the public track page's Details block. Used in the track editor's Basics tab.",
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: ['Drone'],
    suggestions: ['Dub techno', 'Drone', 'Field recording', 'Minimal'],
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <SubgenreTagInput
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next);
          setValue(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Filtering the suggestions and picking one; a chip can be removed again.
export const PickSuggestion: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Add a subgenre' }),
      'dub',
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Dub techno',
      }),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith([
      'Drone',
      'Dub techno',
    ]);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Drone' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['Dub techno']);
  },
};

export const NoSuggestions: Story = {
  args: { suggestions: undefined, value: [] },
};
