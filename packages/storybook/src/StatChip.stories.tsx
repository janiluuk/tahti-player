import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeartIcon, UsersIcon } from 'lucide-react';

import { StatChip } from '@tahti-player/ui';

const meta: Meta<typeof StatChip> = {
  title: 'Components/StatChip',
  component: StatChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'KPI tiles. Production: Admin Dashboard, Content, Storage used/free/total. Next: Admin Governance hand-rolled stat cards. Grant EUR stays StatNumber. See Tahti/Reference/Storybook-first backlog.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof StatChip>>;

export const Default: Story = {
  args: {
    value: 1284,
    label: 'Followers',
  },
};

export const WithIcon: Story = {
  args: {
    value: 412,
    label: 'Favorites',
    icon: <HeartIcon size={16} />,
  },
};

export const Row: Story = {
  render: () => (
    <div className="flex gap-2">
      <StatChip value={1284} label="Followers" icon={<UsersIcon size={16} />} />
      <StatChip value={412} label="Favorites" icon={<HeartIcon size={16} />} />
      <StatChip value="12h 40m" label="Total live" />
    </div>
  ),
};
