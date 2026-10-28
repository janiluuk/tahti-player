import { Meta, StoryObj } from '@storybook/react-vite';
import { AudioLinesIcon, DownloadIcon, UsersIcon } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { StatTile } from '@tahti-player/ui';

const meta = {
  title: 'Components/StatTile',
  component: StatTile,
  tags: ['autodocs'],
} satisfies Meta<typeof StatTile>;

export default meta;

type Story = StoryObj<typeof StatTile>;

export const Grid: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile value={128} label="Votes recorded" />
      <StatTile
        value={14}
        label="Discussions"
        sublabel="Subjects with comments"
      />
      <StatTile
        value={342}
        label="Comments"
        sublabel="Recorded governance comments"
      />
    </div>
  ),
};

export const Toned: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile
        value="1,690"
        label="Plays"
        sublabel="42 today"
        tone="blue"
        icon={<AudioLinesIcon size={16} />}
      />
      <StatTile
        value="1,245"
        label="Downloads"
        sublabel="3 today"
        tone="primary"
        icon={<DownloadIcon size={16} />}
      />
      <StatTile
        value={284}
        label="Followers"
        sublabel="Current audience"
        tone="purple"
        icon={<UsersIcon size={16} />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const icons = canvas.getAllByTestId('stat-tile-icon');
    await expect(icons[0]).toHaveClass('bg-accent-blue-strong');
    await expect(icons[2]).toHaveClass('bg-accent-purple-strong');
    await expect(canvas.getByText('1,690').parentElement).toHaveClass(
      'border-l-accent-blue-strong',
    );
  },
};
