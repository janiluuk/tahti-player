import type { Meta, StoryObj } from '@storybook/react-vite';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { OverflowMenu } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const onEdit = fn();
const onDelete = fn();

const meta: Meta<typeof OverflowMenu> = {
  title: 'Components/OverflowMenu',
  component: OverflowMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact ⋯ menu for secondary page or row actions. Put one primary Button in ViewShell actions; put the rest here. Missing states: ActionSheet variant on narrow viewports (Popover only for now).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: 'edit',
        label: 'Edit',
        icon: <PencilIcon size={16} />,
        onSelect: onEdit,
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        onSelect: () => undefined,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2Icon size={16} />,
        destructive: true,
        onSelect: onDelete,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    onEdit.mockClear();
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'More actions' });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(body.getByRole('button', { name: 'Edit' })).toBeVisible(),
    );
    await userEvent.click(body.getByRole('button', { name: 'Edit' }));
    await expect(onEdit).toHaveBeenCalledOnce();
  },
};
