import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagChipInput } from '@tahti-web/components/TagChipInput';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof TagChipInput> = {
  title: 'Tahti/Track/TagChipInput',
  component: TagChipInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Free-text chip input behind the track editor's Tags and Subgenres fields. Pick a suggestion or type a new value and commit it; duplicates are ignored case-insensitively and the input hides once `maxCount` is reached.",
      },
    },
  },
  tags: ['autodocs'],
  args: {
    label: 'Moods',
    addLabel: 'Add a mood',
    placeholder: 'Type a mood and press Enter',
    maxCount: 4,
    maxLength: 24,
    value: ['dreamy', 'nocturnal'],
    suggestions: ['dreamy', 'euphoric', 'melancholic', 'nocturnal'],
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <TagChipInput
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

// Suggestions already in the list aren't offered again; picking one adds
// it as a chip, and removing a chip frees its suggestion.
export const AddAndRemove: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Add a mood' }));
    await body.findByRole('option', { name: 'euphoric' });
    await expect(body.queryByRole('option', { name: 'dreamy' })).toBeNull();
    await userEvent.click(body.getByRole('option', { name: 'melancholic' }));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      'dreamy',
      'nocturnal',
      'melancholic',
    ]);
    await expect(canvas.getByText('3 / 4')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove dreamy' }),
    );
    await expect(args.onChange).toHaveBeenLastCalledWith([
      'nocturnal',
      'melancholic',
    ]);
  },
};

// A typed value that only differs in case from a chip is ignored.
export const IgnoresDuplicates: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Add a mood' }),
      'DREAMY',
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Add "DREAMY"',
      }),
    );
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByText('2 / 4')).toBeVisible();
  },
};

// At the limit the add field goes away until a chip is removed.
export const Full: Story = {
  args: { value: ['dreamy', 'euphoric', 'melancholic', 'nocturnal'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('combobox')).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove euphoric' }),
    );
    await expect(
      await canvas.findByRole('combobox', { name: 'Add a mood' }),
    ).toBeVisible();
  },
};

export const Empty: Story = { args: { value: [] } };
