import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultistreamPanel } from '@tahti-web/views/studio/go-live/MultistreamPanel';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof MultistreamPanel> = {
  title: 'Tahti/Studio/GoLive/MultistreamPanel',
  component: MultistreamPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/go-live'), withMockAuth()],
  args: { reload: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NoDestinations: Story = { args: { targets: [] } };

export const WithDestinations: Story = {
  args: {
    targets: [
      {
        id: 'rtmp-yt',
        provider: 'YOUTUBE',
        label: 'YouTube',
        rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
        alwaysMirror: true,
        enabled: true,
        keyLast4: 'x9f2',
      },
      {
        id: 'rtmp-yt-2',
        provider: 'YOUTUBE',
        label: 'Backup',
        rtmpUrl: 'rtmp://b.rtmp.youtube.com/live2',
        alwaysMirror: false,
        enabled: false,
        keyLast4: 'demo',
      },
    ],
  },
};
