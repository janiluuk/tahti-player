import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  useLibraryStore,
  type HistoryEntry,
} from '@tahti-web/stores/libraryStore';
import { HistoryView } from '@tahti-web/views/HistoryView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, selectTab } from './_lib/play';

function entry(
  minutesAgo: number,
  title: string,
  artist: string,
): HistoryEntry {
  return {
    playedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    playable: {
      id: `${title}-${minutesAgo}`,
      kind: 'sound',
      title,
      artist,
      streamUrl: 'https://example.com/stream.mp3',
      protocol: 'https',
      channelSlug: artist.toLowerCase().replace(/\s+/g, '-'),
    },
  };
}

const LOCAL_HISTORY: HistoryEntry[] = [
  entry(5, 'Midnight Drift', 'Nightbloom'),
  entry(52, 'Low Tide', 'Aurinko'),
  entry(130, 'Static Bloom', 'Kaiku'),
  entry(60 * 26, 'Glass Fields', 'Sumu Collective'),
];

function withHistory(history: HistoryEntry[]) {
  return () => {
    const previous = useLibraryStore.getState().history;
    useLibraryStore.setState({ history });
    return () => {
      useLibraryStore.setState({ history: previous });
    };
  };
}

const meta: Meta<typeof HistoryView> = {
  title: 'Tahti/History/HistoryView',
  component: HistoryView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Library → History (`/library/history`): a Stats tab (signed-in listening across devices from the API, then charts built from this browser's play history) and a Listening history tab (day-grouped list with play/queue actions).",
      },
    },
  },
  decorators: [withTahtiRouter('/library/history'), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOutWithHistory: Story = {
  beforeEach: withHistory(LOCAL_HISTORY),
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'History' }),
    ).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Stats' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectVisible(await canvas.findByText('Top artists'));
    await expect(canvas.getByText('Top tracks')).toBeVisible();
    await expect(canvas.queryByText('Across your devices')).toBeNull();

    await selectTab(canvas, 'Listening history');
    await expectVisible(await canvas.findByText('Midnight Drift'));
    await expect(canvas.getByText('Glass Fields')).toBeVisible();
  },
};

export const SignedOutEmpty: Story = {
  beforeEach: withHistory([]),
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Nothing to show yet'));
    await selectTab(canvas, 'Listening history');
    await expectVisible(await canvas.findByText('Nothing played yet'));
  },
};

export const SignedInAcrossDevices: Story = {
  beforeEach: withHistory([]),
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Across your devices' }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        'Everything you listened to on Tahti while signed in, on any device.',
      ),
    ).toBeVisible();
    await expectVisible(await canvas.findByText('Time listened'));
    await expect(canvas.getByText('Listens')).toBeVisible();
    await expect(canvas.getByText('96')).toBeVisible();
    await expect(canvas.getByText('Kaiku Collective')).toBeVisible();
    await expect(canvas.getByText('Polar Night')).toBeVisible();
    // Account listening replaces the empty local-stats placeholder.
    await expect(canvas.queryByText('Nothing to show yet')).toBeNull();
  },
};
