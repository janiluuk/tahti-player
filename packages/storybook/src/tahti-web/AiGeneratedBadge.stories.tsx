import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiGeneratedBadge } from '@tahti-web/views/track-detail/AiGeneratedBadge';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof AiGeneratedBadge> = {
  title: 'Tahti/Track/AiGeneratedBadge',
  component: AiGeneratedBadge,
  parameters: {
    layout: 'centered',
    // The badge is styled for the track page's dark hero.
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Label beside the title on the public track page when the artist turned on "Made with generative AI" in the track editor\'s Advanced tab.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-neutral-900 p-4 text-white">
        <Story />
      </div>
    ),
  ],
  args: { show: true },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Shown: Story = {
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText('AI-generated');
    await expect(badge).toHaveAttribute(
      'title',
      'The artist marked this track as made with generative AI',
    );
  },
};

export const Hidden: Story = {
  args: { show: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('AI-generated')).toBeNull();
  },
};
