import type { Meta, StoryObj } from '@storybook/react-vite';
import { NowPlayingBar } from '@tahti-web/views/studio/collection-edit/NowPlayingBar';

const meta: Meta<typeof NowPlayingBar> = {
  title: 'Tahti/Studio/CollectionEdit/NowPlayingBar',
  component: NowPlayingBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { title: 'Aurora (Extended Mix)' } };

export const LongTitle: Story = {
  args: {
    title:
      'A very long track title that should truncate gracefully inside the bar',
  },
};
