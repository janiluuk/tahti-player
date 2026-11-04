import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaterialTagsField } from '@tahti-web/components/MaterialTagsField';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const USED_BEFORE = [
  'Electronica',
  'House',
  'Melodic',
  'Techno',
  'Chillout',
  'Deep House',
];

const meta: Meta<typeof MaterialTagsField> = {
  title: 'Tahti/Track/MaterialTagsField',
  component: MaterialTagsField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tags card for material edit — chips, add field, and Used before quick-adds.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: ['Trance', 'Progressive Trance', 'Progressive House'],
    usedBefore: USED_BEFORE,
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="max-w-xl">
        <MaterialTagsField
          {...args}
          value={value}
          onChange={(next) => {
            args.onChange(next);
            setValue(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Empty: Story = { args: { value: [] } };

export const AddUsedBefore: Story = {
  args: { value: ['Trance'] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add House' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['Trance', 'House']);
  },
};

export const TypeTag: Story = {
  args: { value: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Add a tag' }),
      'night drive',
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Add "night drive"',
      }),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith(['night drive']);
  },
};
