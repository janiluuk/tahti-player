import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryListSection } from '@tahti-web/components/history/HistoryListSection';
import type { HistoryEntry } from '@tahti-web/stores/libraryStore';

function entry(
  minutesAgo: number,
  title: string,
  artist: string,
  channelSlug: string,
): HistoryEntry {
  return {
    playedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    playable: {
      id: `${title}-${minutesAgo}`,
      kind: 'sound',
      title,
      artist,
      coverUrl: undefined,
      streamUrl: 'https://example.com/stream.mp3',
      protocol: 'https',
      channelSlug,
    },
  };
}

const artists = [
  'Nightbloom',
  'Aurinko',
  'Kaiku',
  'Sumu Collective',
  'Revontulet',
];
const tracks = [
  'Midnight Drift',
  'Low Tide',
  'Static Bloom',
  'Glass Fields',
  'Echo Chamber',
];

const mockHistory: HistoryEntry[] = Array.from({ length: 34 }, (_, i) =>
  entry(
    i * 47,
    tracks[i % tracks.length]!,
    artists[i % artists.length]!,
    artists[i % artists.length]!.toLowerCase().replace(/\s+/g, '-'),
  ),
);

const meta: Meta<typeof HistoryListSection> = {
  title: 'Tahti/History/HistoryListSection',
  component: HistoryListSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The real, currently-shipped "List" tab of the Listening History page (`packages/tahti-web/src/components/history/HistoryListSection.tsx`). ' +
          'Composes the shared `@tahti-player/ui` HistoryRow/HistoryDayGroup/Pagination primitives exactly as production does — added alongside the ' +
          'existing standalone HistoryRow.stories and HistoryDayGroup.stories so there is an in-context counterpart showing real day-grouping and paging.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { history: mockHistory },
};

export const Empty: Story = {
  args: { history: [] },
};
