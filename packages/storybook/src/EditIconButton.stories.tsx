import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { EditIconButton } from '@tahti-player/ui';

const meta: Meta<typeof EditIconButton> = {
  title: 'Components/EditIconButton',
  component: EditIconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The app-wide edit action: a pencil icon button with a tooltip. Pass `editing` to use it as the toggle that shows and hides an edit form; content pages open read-only and show their form only after it is pressed. `EditIconLink` is the same button as a router link.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof EditIconButton>>;

export const Default: Story = {
  args: { label: 'Edit details' },
};

export const NamedForItem: Story = {
  args: { label: 'Edit Night Drive' },
};

export const EditModeToggle: Story = {
  render: function Render() {
    const [editing, setEditing] = useState(false);
    return (
      <div className="flex items-center gap-3">
        <EditIconButton
          label="Edit details"
          editing={editing}
          onClick={() => setEditing((value) => !value)}
        />
        <span className="text-sm">{editing ? 'Form shown' : 'Read-only'}</span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Edit details' }));
    await expect(canvas.getByText('Form shown')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Done editing' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Disabled: Story = {
  args: { label: 'Edit details', disabled: true },
};
