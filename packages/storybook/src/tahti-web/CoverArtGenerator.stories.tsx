import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverArtGenerator } from '@tahti-web/components/CoverArtGenerator';

const meta: Meta<typeof CoverArtGenerator> = {
  title: 'Tahti/Studio/CoverArtGenerator',
  component: CoverArtGenerator,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onGenerate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Generating: Story = {
  args: { generating: true },
};
