import type { Meta, StoryObj } from '@storybook/react-vite';

import { SectionTitle } from '@tahti-player/ui';

const meta = {
  title: 'Components/SectionTitle',
  component: SectionTitle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Section heading with optional Badge pill and className for accent borders (e.g. Listen New tracks). Prefer this over hand-rolled h2 + Badge rows.',
      },
    },
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof SectionTitle>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <SectionTitle title="New tracks" />
      <SectionTitle title="On air" badge="Live" badgeColor="green" />
      <SectionTitle title="Radio" badge="Internet radio" badgeColor="cyan" />
      <SectionTitle
        title="Recently played"
        badge="History"
        badgeColor="yellow"
      />
      <SectionTitle
        title="New tracks"
        className="border-accent-purple/40 border-l-4 pl-3"
      />
    </div>
  ),
};
