import type { Meta, StoryObj } from '@storybook/react-vite';
import type { JamClient } from '@tahti-web/remote/jamClient';
import { JamRemote } from '@tahti-web/remote/JamRemote';
import { expect, within } from 'storybook/test';

import type { QueueItem } from '@tahti-player/model';

const item = (id: string, title: string, artist: string): QueueItem => ({
  id,
  status: 'success',
  addedAtIso: '2026-10-14T00:00:00Z',
  track: {
    title,
    artists: [{ name: artist, roles: ['performer'] }],
    source: { provider: 'tahti', id },
  },
});

const done = async () => null;

const client: JamClient = {
  eventsUrl: '/api/events?token=story',
  queue: async () => ({
    items: [
      item('a', 'Night Drive', 'Aurora Lines'),
      item('b', 'Static Bloom', 'Kaiku'),
      item('c', 'Harbour Lights', 'Selja'),
    ],
    currentIndex: 0,
  }),
  playback: async () => ({
    status: 'playing',
    seek: 74,
    duration: 212,
    volume: 0.8,
    muted: false,
  }),
  settings: async () => ({ shuffle: false, repeat: 'all' }),
  toggle: done,
  next: done,
  previous: done,
  seek: done,
  shuffle: done,
  repeat: done,
  playItem: done,
  remove: done,
  add: done,
  search: async () => ({ tracks: [] }),
};

class SilentEventSource {
  constructor(public url: string) {
    queueMicrotask(() => this.onOpen?.(new Event('open')));
  }
  onOpen?: (event: Event) => void;
  addEventListener(type: string, listener: (event: Event) => void) {
    if (type === 'open') {
      this.onOpen = listener;
    }
  }
  close() {}
}

const meta: Meta<typeof JamRemote> = {
  title: 'Tahti/Desktop/JamRemote',
  component: JamRemote,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        component:
          'The Tahti Jam phone remote, served by the desktop app at `/remote` on the local network. A phone pairs by scanning the QR code in Settings → Integrations. Not the same as the shared listening sessions at `/jam/$code`. Missing states: search results (needs a live Tahti search).',
      },
    },
  },
  beforeEach: () => {
    const original = globalThis.EventSource;
    globalThis.EventSource = SilentEventSource as unknown as typeof EventSource;
    return () => {
      globalThis.EventSource = original;
    };
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  args: { client },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect((await canvas.findAllByText('Night Drive'))[0]).toBeVisible();
  },
};

export const NotPaired: Story = { args: { client: null } };
