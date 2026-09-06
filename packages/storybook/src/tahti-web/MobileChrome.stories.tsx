import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedPlayerBar } from '@tahti-web/components/ConnectedPlayerBar';
import {
  MobileBottomNav,
  MobileDrawer,
} from '@tahti-web/components/MobileChrome';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useState } from 'react';

import type { QueueItem } from '@tahti-player/model';
import { Button } from '@tahti-player/ui';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof MobileBottomNav> = {
  title: 'Tahti/Chrome/MobileChrome',
  component: MobileBottomNav,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

function seedPlayingBar() {
  const item: QueueItem = {
    id: 'archive:1',
    track: {
      title: 'Midnight Drift',
      artists: [{ name: 'Northern Lights', roles: ['performer'] }],
      durationMs: 245000,
      source: { provider: 'tahti', id: 'archive:1' },
      streamCandidates: [
        {
          id: 'archive:1:stream',
          title: 'Midnight Drift',
          failed: false,
          source: { provider: 'tahti', id: 'archive:1' },
          stream: {
            url: 'https://stream.tahti.live/archive:1/live.m3u8',
            protocol: 'hls',
            source: { provider: 'tahti', id: 'archive:1' },
          },
          lastResolvedAtIso: new Date().toISOString(),
        },
      ],
      artwork: {
        items: [
          { url: 'https://picsum.photos/seed/archive1/128', purpose: 'cover' },
        ],
      },
    },
    status: 'idle',
    addedAtIso: new Date().toISOString(),
  };
  usePlayerStore.setState({
    queue: [item],
    currentId: item.id,
    status: 'playing',
    isLive: false,
    currentTime: 62,
    duration: 245,
    volume: 0.7,
    muted: false,
    shuffle: false,
    repeatMode: 'off',
    playerBarVisible: true,
  });
}

export const BottomNavListener: Story = {
  name: 'MobileBottomNav (listener — Listen / Discover / Radio / More)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  render: () => (
    <div className="bg-background-secondary flex h-24 flex-col justify-end">
      <MobileBottomNav />
    </div>
  ),
};

export const BottomNavArtist: Story = {
  name: 'MobileBottomNav (artist — Studio tab + More)',
  decorators: [withMockAuth(MOCK_USERS.artist)],
  render: () => (
    <div className="bg-background-secondary flex h-24 flex-col justify-end">
      <MobileBottomNav />
    </div>
  ),
};

export const ChromeStackPlaying: Story = {
  name: 'Compact player stacked on slim bottom nav (playing)',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  render: function StackStory() {
    seedPlayingBar();
    return (
      <div className="bg-background-secondary flex h-48 flex-col justify-end">
        <p className="text-foreground-secondary px-3 pb-2 text-xs">
          Narrow the canvas below 768px. Compact player stays visible above the
          slim nav while playing.
        </p>
        <ConnectedPlayerBar />
        <MobileBottomNav />
      </div>
    );
  },
};

export const Drawer: StoryObj = {
  name: 'MobileDrawer',
  render: function DrawerStory() {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-6">
        <Button size="sm" onClick={() => setOpen(true)}>
          Open drawer
        </Button>
        <MobileDrawer
          open={open}
          title="Navigate"
          onClose={() => setOpen(false)}
        >
          <p className="text-sm">Drawer content goes here.</p>
        </MobileDrawer>
      </div>
    );
  },
};

export const DrawerNoTitle: StoryObj = {
  name: 'MobileDrawer (no title — content owns its own header)',
  render: () => (
    <div className="p-6">
      <MobileDrawer open title={undefined} side="right" onClose={() => {}}>
        <p className="text-sm">
          When `title` is omitted, the header row shows only the close button —
          used when the drawer&apos;s own content (e.g. RightRailPanel) already
          renders an icon + label.
        </p>
      </MobileDrawer>
    </div>
  ),
};
