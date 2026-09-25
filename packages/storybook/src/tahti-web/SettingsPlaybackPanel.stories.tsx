import type { Meta, StoryObj } from '@storybook/react-vite';
import { usePlaybackPrefsStore } from '@tahti-web/stores/playbackPrefsStore';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { PlaybackPanel } from '@tahti-web/views/settings/panels/PlaybackPanel';

import { withPageSurface } from './_lib/decorators';

const meta: Meta<typeof PlaybackPanel> = {
  title: 'Tahti/Settings/PlaybackPanel',
  component: PlaybackPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Playback: volume, mute, shuffle, repeat and skip duration (Shift+Arrow, media keys). Crossfade is shown disabled because the web player has no crossfade yet. Missing states: loading/error (all values are local, so there are none).',
      },
    },
  },
  decorators: [withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    usePlayerStore.setState({
      volume: 0.85,
      muted: false,
      shuffle: false,
      repeatMode: 'off',
      isLive: false,
    });
    usePlaybackPrefsStore.setState({ skipSeconds: 5 });
  },
};

export const MutedRepeatAll: Story = {
  beforeEach: () => {
    usePlayerStore.setState({
      volume: 0.4,
      muted: true,
      shuffle: true,
      repeatMode: 'all',
      isLive: false,
    });
    usePlaybackPrefsStore.setState({ skipSeconds: 15 });
  },
};
