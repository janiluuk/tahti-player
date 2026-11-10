import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { expect, within } from 'storybook/test';

import { Input } from '@tahti-player/ui';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const TextBasic: Story = {
  args: {
    label: 'Username',
    placeholder: 'your-username',
    description: 'This is your public display name.',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: '••••••••',
    variant: 'password',
  },
};

export const NumberControlled: Story = {
  render: () => {
    const [n, setN] = useState(42);
    return (
      <div style={{ width: 360 }}>
        <Input
          label="Buffer Size"
          variant="number"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          min={0}
          max={2048}
          step={1}
        />
        <div style={{ marginTop: 12 }}>Current: {n}</div>
      </div>
    );
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    placeholder: 'your-username',
    error: 'Username is already taken',
    description: 'Choose something unique and memorable.',
  },
};

export const ErrorNoDescription: Story = {
  args: {
    label: 'Username',
    placeholder: 'your-username',
    error: 'Username is already taken',
  },
};

export const WithEndAddon: Story = {
  name: 'End addon (idle — empty field)',
  args: {
    label: 'Search',
    placeholder: 'Filter tracks',
    endAddon: (
      <FilterIcon
        className="h-4 w-4 opacity-70"
        aria-hidden="true"
        strokeWidth={3}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const addon = within(canvasElement).getByTestId('input-end-addon');
    await expect(addon).not.toHaveAttribute('data-active');
  },
};

export const WithEndAddonActive: Story = {
  name: 'End addon (active — field modified)',
  args: {
    label: 'Search',
    placeholder: 'Filter tracks',
    value: 'midnight',
    endAddon: (
      <FilterIcon className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
    ),
  },
  play: async ({ canvasElement }) => {
    const addon = within(canvasElement).getByTestId('input-end-addon');
    await expect(addon).toHaveAttribute('data-active', 'true');
  },
};

export const WithStartAddon: Story = {
  args: {
    label: 'SoundCloud',
    placeholder: 'polar-nights',
    startAddon: (
      <span className="truncate" title="https://soundcloud.com/you">
        soundcloud.com/you/
      </span>
    ),
  },
};

export const AddonWithWidth: Story = {
  args: {
    'aria-label': 'Search help',
    placeholder: 'Search help',
    className: 'max-w-md',
    startAddon: <SearchIcon size={14} aria-hidden className="opacity-70" />,
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', {
      name: 'Search help',
    });
    const frame = field.parentElement as HTMLElement;
    const root = frame.parentElement as HTMLElement;
    await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(448);
    await expect(frame.getBoundingClientRect().width).toBe(
      root.getBoundingClientRect().width,
    );
    await expect(
      frame.getBoundingClientRect().right - field.getBoundingClientRect().right,
    ).toBeLessThanOrEqual(4);
  },
};

export const Color: Story = {
  args: {
    type: 'color',
    'aria-label': 'Accent color',
    defaultValue: '#ff9900',
  },
};
