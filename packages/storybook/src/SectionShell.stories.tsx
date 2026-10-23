import type { Meta, StoryObj } from '@storybook/react-vite';

import { SectionShell } from '@tahti-player/ui';

const meta = {
  title: 'Components/SectionShell',
  component: SectionShell,
  tags: ['autodocs'],
} satisfies Meta<typeof SectionShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Recently played',
    children: (
      <p className="text-foreground-secondary text-sm">
        Section content sits under the heading at full width.
      </p>
    ),
  },
};

export const Stacked: Story = {
  args: { title: 'Unused', children: null },
  render: () => (
    <div className="flex flex-col">
      <SectionShell title="New releases">
        <p className="text-foreground-secondary text-sm">First section.</p>
      </SectionShell>
      <SectionShell title="Popular this week">
        <p className="text-foreground-secondary text-sm">Second section.</p>
      </SectionShell>
    </div>
  ),
};
