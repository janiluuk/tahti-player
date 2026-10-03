import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { CreatableCombobox } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const meta: Meta<typeof CreatableCombobox> = {
  title: 'Components/Combobox',
  component: CreatableCombobox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A searchable select that also lets the user type a brand-new value and add it on the fly (e.g. genre tags). Used in tahti-web via GenrePicker and single-genre track fields. Missing states: disabled, empty options list, validation error.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof CreatableCombobox>>;

const GENRES = ['House', 'Techno', 'Ambient', 'Drum & Bass', 'Disco'];

function Interactive() {
  const [options, setOptions] = useState(GENRES);
  const [value, setValue] = useState('');
  return (
    <div className="w-72">
      <CreatableCombobox
        label="Genre"
        description="Pick an existing genre, or type a new one."
        options={options}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          if (!options.includes(next)) {
            setOptions((prev) => [...prev, next]);
          }
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Interactive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Genre' });

    await userEvent.type(input, 'tech');
    const listbox = within(await body.findByRole('listbox'));
    // The options panel fades in.
    await waitFor(() =>
      expect(listbox.getByRole('option', { name: 'Techno' })).toBeVisible(),
    );
    await expect(listbox.queryByRole('option', { name: 'House' })).toBeNull();

    await userEvent.clear(input);
    await userEvent.type(input, 'Jungle');
    await userEvent.click(
      await body.findByRole('option', { name: 'Add "Jungle"' }),
    );
    await expect(input).toHaveValue('Jungle');

    await userEvent.clear(input);
    await userEvent.type(input, 'jun');
    const created = await body.findByRole('option', { name: /^Jungle/ });
    await waitFor(() => expect(created).toBeVisible());
  },
};
