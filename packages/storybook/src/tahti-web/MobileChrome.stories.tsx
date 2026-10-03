import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConnectedPlayerBar } from '@tahti-web/components/ConnectedPlayerBar';
import {
  MobileBottomNav,
  MobileDrawer,
} from '@tahti-web/components/MobileChrome';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';
import { Button } from '@tahti-player/ui';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { withinBody } from './_lib/play';

const meta: Meta<typeof MobileBottomNav> = {
  title: 'Tahti/Chrome/MobileChrome',
  component: MobileBottomNav,
  // The drawer is `md:hidden` and the bottom nav is phone chrome, so the
  // whole file renders at a phone viewport (also in the test runner).
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: { onOpenMore: fn() },
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
  render: (args) => (
    <div className="bg-background-secondary flex h-24 flex-col justify-end">
      <MobileBottomNav {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const nav = within(
      within(canvasElement).getByRole('navigation', { name: 'Primary' }),
    );
    await expect(nav.getByRole('link', { name: 'Listen' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByRole('link', { name: 'Discover' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Radio' })).toBeVisible();
    await expect(nav.queryByRole('link', { name: 'Studio' })).toBeNull();
    await userEvent.click(nav.getByRole('button', { name: 'More' }));
    await expect(args.onOpenMore).toHaveBeenCalledOnce();
  },
};

export const BottomNavArtist: Story = {
  name: 'MobileBottomNav (artist — Studio tab + More open)',
  decorators: [withMockAuth(MOCK_USERS.artist)],
  render: (args) => (
    <div className="bg-background-secondary flex h-24 flex-col justify-end">
      <MobileBottomNav {...args} moreOpen />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(
      within(canvasElement).getByRole('navigation', { name: 'Primary' }),
    );
    await expect(nav.getByRole('link', { name: 'Studio' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'More' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
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
  play: async ({ canvasElement }) => {
    const body = withinBody(canvasElement);
    const drawer = within(await body.findByRole('dialog'));
    await expect(
      drawer.getByRole('heading', { name: 'Navigate' }),
    ).toBeVisible();
    // Focus moves into the panel (its own close button) when it opens.
    await waitFor(() => expect(panelCloseButton(body)).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());

    await userEvent.click(body.getByRole('button', { name: 'Open drawer' }));
    await expect(await body.findByRole('dialog')).toBeVisible();
    await userEvent.click(panelCloseButton(body));
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

/** The panel's X button; the full-screen backdrop is also labelled Close
 * and comes first in the DOM. */
function panelCloseButton(body: ReturnType<typeof within>) {
  const buttons = within(body.getByRole('dialog')).getAllByRole('button', {
    name: 'Close',
  });
  return buttons[buttons.length - 1]!;
}

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
