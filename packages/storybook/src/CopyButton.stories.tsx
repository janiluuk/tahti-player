import type { Meta, StoryObj } from '@storybook/react-vite';
import { RssIcon } from 'lucide-react';

import { CopyButton } from '@tahti-player/ui';

const meta: Meta<typeof CopyButton> = {
  title: 'Components/CopyButton',
  component: CopyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof CopyButton>>;

export const Default: Story = {
  args: {
    text: 'https://tahti.live/u/demo',
  },
};

export const InlineWithLabel: Story = {
  render: () => (
    <div className="border-border bg-background-secondary/40 flex items-center gap-2 rounded-lg border p-3 text-sm">
      <code className="text-foreground-secondary">
        https://tahti.live/u/demo
      </code>
      <CopyButton text="https://tahti.live/u/demo" />
    </div>
  ),
};

export const CustomIcon: Story = {
  args: {
    text: 'https://tahti.live/u/demo/feed.xml',
    icon: <RssIcon size={16} aria-hidden />,
    variant: 'secondary',
    'aria-label': 'Copy the RSS feed of Demo',
  },
};
