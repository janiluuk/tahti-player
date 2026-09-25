import { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChevronDownIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button, Input, Popover } from '@tahti-player/ui';

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The **Dropdown Menu** and **Sectioned Menu** stories below are the base pattern for any button-triggered action menu. Compose `Popover` + `Popover.Menu` directly for any trigger shape (a plain button, an icon button, a table row) and any menu shape (flat, sectioned, with a footer).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Meta<typeof Popover>>;

export const Default: Story = {
  args: {
    trigger: <Button>Open Popover</Button>,
    children: 'Popover content',
    anchor: 'bottom',
  },
};

export const AllAnchors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Popover
        trigger={<Button>Opens top</Button>}
        children="Popover content"
        anchor="top"
      />
      <Popover
        trigger={<Button>Opens below</Button>}
        children="Popover content"
        anchor="bottom"
      />
      <Popover
        trigger={<Button>Opens right</Button>}
        children="Popover content"
        anchor="right"
      />
      <Popover
        trigger={<Button>Opens left</Button>}
        children="Popover content"
        anchor="left"
      />
    </div>
  ),
};

export const SectionedMenu: Story = {
  render: () => (
    <Popover
      panelClassName="bg-background px-0 py-0"
      trigger={<Button>Recent</Button>}
      anchor="bottom"
    >
      <Popover.Menu>
        <Popover.Section label="Recent searches">
          <Popover.Item onClick={() => console.log('nirvana')}>
            nirvana
          </Popover.Item>
          <Popover.Item onClick={() => console.log('pixies')}>
            pixies
          </Popover.Item>
        </Popover.Section>
        <Popover.Footer>
          <Popover.Item
            intent="danger"
            align="center"
            icon={<Trash2Icon size={16} />}
            onClick={() => console.log('clear')}
          >
            Clear recent searches
          </Popover.Item>
        </Popover.Footer>
      </Popover.Menu>
    </Popover>
  ),
};

export const DropdownMenu: Story = {
  render: () => (
    <Popover
      panelClassName="bg-background px-0 py-0"
      trigger={<Button>Actions</Button>}
      anchor="bottom"
    >
      <Popover.Menu>
        <Popover.Item
          icon={<PencilIcon size={16} />}
          onClick={() => console.log('edit')}
        >
          Edit
        </Popover.Item>
        <Popover.Item onClick={() => console.log('duplicate')}>
          Duplicate
        </Popover.Item>
        <Popover.Item
          intent="danger"
          icon={<Trash2Icon size={16} />}
          onClick={() => console.log('delete')}
        >
          Delete
        </Popover.Item>
      </Popover.Menu>
    </Popover>
  ),
};

/** Popover sits in normal flow, so it can share a row with other controls without overlapping them. */
export const InlineToolbar: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex w-full max-w-xl items-center gap-2">
      <Input
        type="search"
        placeholder="Search all tracks…"
        aria-label="Search all tracks"
        startAddon={<SearchIcon size={14} aria-hidden />}
      />
      <Popover
        anchor="bottom end"
        className="shrink-0"
        panelClassName="bg-background px-0 py-0"
        trigger={
          <Button variant="secondary" className="gap-1.5">
            Newest first
            <ChevronDownIcon size={16} className="opacity-70" />
          </Button>
        }
      >
        <Popover.Menu>
          <Popover.Item>Newest first</Popover.Item>
          <Popover.Item>Oldest first</Popover.Item>
          <Popover.Item>Title A–Z</Popover.Item>
        </Popover.Menu>
      </Popover>
    </div>
  ),
};
