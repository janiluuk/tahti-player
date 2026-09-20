import { Meta, StoryObj } from '@storybook/react-vite';

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
