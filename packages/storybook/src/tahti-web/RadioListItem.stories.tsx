import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioListItem } from '@tahti-web/components/RadioListItem';

const meta: Meta<typeof RadioListItem> = {
  title: 'Tahti/Radio/RadioListItem',
  component: RadioListItem,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    name: 'Tahti Radio',
    coverUrl: 'https://picsum.photos/seed/tahti-radio/200',
    subtitle: 'Aurora Skies · Northern Lights',
    isPlaying: false,
    onTogglePlay: () => {},
    visualPreset: 'AURORA',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Playing: Story = {
  args: {
    isPlaying: true,
  },
};

export const Offline: Story = {
  args: {
    subtitle: 'Temporarily offline',
    disabled: true,
  },
};

export const NoCoverArt: Story = {
  name: 'No cover art (placeholder)',
  args: {
    coverUrl: null,
  },
};
