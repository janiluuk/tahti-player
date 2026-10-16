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
          'A searchable select that also lets the user type a brand-new value and add it on the fly (e.g. genre tags). Used in tahti-web via GenrePicker and single-genre track fields. Covers default, disabled, empty options, and a validation-error layout.',
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

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <CreatableCombobox
        label="Genre"
        description="Disabled while the track saves."
        options={GENRES}
        value="House"
        onValueChange={() => undefined}
        disabled
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('combobox', { name: 'Genre' }),
    ).toBeDisabled();
  },
};

export const EmptyOptions: Story = {
  render: () => (
    <div className="w-72">
      <CreatableCombobox
        label="Tag"
        description="No presets yet — type to create one."
        options={[]}
        value=""
        onValueChange={() => undefined}
        emptyLabel="No tags yet"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Tag' });
    await userEvent.click(input);
    await userEvent.type(input, 'a');
    await expect(
      await body.findByRole('option', { name: 'Add "a"' }),
    ).toBeVisible();
  },
};

export const ValidationError: Story = {
  render: () => (
    <div className="w-72">
      <CreatableCombobox
        label="Genre"
        description="Pick a genre from the list."
        options={GENRES}
        value=""
        onValueChange={() => undefined}
      />
      <p className="text-accent-red mt-2 text-xs" role="alert">
        Genre is required.
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Genre is required.',
    );
  },
};
