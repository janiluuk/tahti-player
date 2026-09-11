import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BookmarkPlusIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react';

import { DropdownButton } from '@tahti-player/ui';

const meta: Meta<typeof DropdownButton> = {
  title: 'Components/DropdownButton',
  component: DropdownButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof DropdownButton>>;

export const Default: Story = {
  args: {
    label: 'More',
    items: [
      { id: 'a', label: 'Duplicate', onClick: () => {} },
      { id: 'b', label: 'Archive', onClick: () => {} },
    ],
  },
};

/** The pattern used in Channel Designer: a primary Save button stays its
 * own control (with its saving/disabled state), and its variants collapse
 * into one dropdown next to it instead of three competing buttons. */
export const SaveVariantsGroup: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <DropdownButton
        label="…"
        aria-label="More options"
        items={[
          {
            id: 'save-preset',
            label: 'Save preset',
            icon: <BookmarkPlusIcon size={16} />,
            onClick: () => {},
          },
          {
            id: 'reset',
            label: 'Reset',
            icon: <RotateCcwIcon size={16} />,
            onClick: () => {},
          },
        ]}
      />
      <button
        type="button"
        className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold"
      >
        <SaveIcon size={16} aria-hidden />
        Save layout
      </button>
    </div>
  ),
};

export const WithDisabledAndDangerItems: Story = {
  args: {
    label: 'Manage',
    items: [
      { id: 'edit', label: 'Edit', onClick: () => {} },
      {
        id: 'duplicate',
        label: 'Duplicate',
        disabled: true,
        onClick: () => {},
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2Icon size={16} />,
        intent: 'danger',
        onClick: () => {},
      },
    ],
  },
};
