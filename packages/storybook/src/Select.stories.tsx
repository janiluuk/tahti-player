import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Select } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
};

export default meta;

type Story = StoryObj<typeof Select>;

const OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const Basic: Story = {
  args: {
    label: 'Quality',
    options: OPTIONS,
    defaultValue: 'medium',
    description: 'Choose your preferred playback quality.',
  },
};

export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState('low');
    return (
      <div style={{ width: 360 }}>
        <Select
          label="Quality"
          options={OPTIONS}
          value={val}
          onValueChange={setVal}
        />
        <div style={{ marginTop: 12 }}>Current: {val}</div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Quality/ }));
    const listbox = within(await body.findByRole('listbox'));
    await expect(listbox.getAllByRole('option')).toHaveLength(3);
    await userEvent.click(listbox.getByRole('option', { name: 'High' }));
    await expect(canvas.getByText('Current: high')).toBeVisible();
    await waitFor(() => expect(body.queryByRole('listbox')).toBeNull());
  },
};

export const WithError: Story = {
  args: {
    label: 'Quality',
    options: OPTIONS,
    error: 'Please make a selection',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Quality',
    options: OPTIONS,
    defaultValue: 'medium',
    description: 'Disabled control',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: /Quality/ }),
    ).toBeDisabled();
  },
};
