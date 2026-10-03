import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrackTagInput } from '@tahti-web/components/TrackTagInput';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof TrackTagInput> = {
  title: 'Tahti/Track/TrackTagInput',
  component: TrackTagInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A sound's free-form tags (up to 20, 40 characters each), shown as chips on the public track page. Used in the track editor's Basics tab.",
      },
    },
  },
  tags: ['autodocs'],
  args: { value: ['night drive', 'Helsinki'], onChange: fn() },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <TrackTagInput
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

// Typing a new tag offers it as an "Add" option; long text is cut to 40
// characters.
export const AddTag: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Add a tag' }),
      'field recordings',
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Add "field recordings"',
      }),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith([
      'night drive',
      'Helsinki',
      'field recordings',
    ]);
    await expect(canvas.getByText('3 / 20')).toBeVisible();
  },
};

export const Empty: Story = { args: { value: [] } };
