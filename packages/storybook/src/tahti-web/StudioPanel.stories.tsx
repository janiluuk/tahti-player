import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioPanel } from '@tahti-web/components/StudioPanel';

import { Badge, Button } from '@tahti-player/ui';

const meta: Meta<typeof StudioPanel> = {
  title: 'Tahti/Page/StudioPanel',
  component: StudioPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'System health',
    description: 'Live checks across the production stack.',
    children: (
      <div className="flex items-center justify-between text-sm">
        <span>Icecast / Liquidsoap</span>
        <Badge variant="pill" color="green">
          OK
        </Badge>
      </div>
    ),
  },
};

export const WithAction: Story = {
  args: {
    title: 'Needs action',
    action: <Button size="sm">View all</Button>,
    children: (
      <p className="text-foreground-secondary text-sm">
        Nothing needs action right now.
      </p>
    ),
  },
};

export const NoHeader: Story = {
  args: {
    children: <p className="text-sm">Panel body with no title/action row.</p>,
  },
};
