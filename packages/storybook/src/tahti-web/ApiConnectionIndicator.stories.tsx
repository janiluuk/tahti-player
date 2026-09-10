import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge, TahtiLogo } from '@tahti-player/ui';

const meta = {
  title: 'Tahti/Chrome/API connection',
  component: Badge,
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Disconnected: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <TahtiLogo />
      <span role="status">
        <Badge variant="pill" color="red">
          API disconnected
        </Badge>
      </span>
    </div>
  ),
};
