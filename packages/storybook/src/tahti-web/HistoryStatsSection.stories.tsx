import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryStatsSection } from '@tahti-web/components/history/HistoryStatsSection';
import type { HistoryEntry } from '@tahti-web/stores/libraryStore';

function entry(
  daysAgo: number,
  hour: number,
  title: string,
  artist: string,
  channelSlug: string,
): HistoryEntry {
  const playedAt = new Date(Date.now() - daysAgo * 86_400_000);
  playedAt.setHours(hour, 0, 0, 0);
  return {
    playedAt: playedAt.toISOString(),
    playable: {
      id: `${title}-${daysAgo}-${hour}`,
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

const mockHistory: HistoryEntry[] = Array.from({ length: 120 }, (_, i) =>
  entry(
    Math.floor(i / 4),
    (i * 3) % 24,
    tracks[i % tracks.length]!,
    artists[i % artists.length]!,
    `${artists[i % artists.length]!.toLowerCase().replace(/\s+/g, '-')}`,
  ),
);

const meta: Meta<typeof HistoryStatsSection> = {
  title: 'Tahti/History/HistoryStatsSection',
  component: HistoryStatsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The real, currently-shipped "Stats" tab of the Listening History page (`packages/tahti-web/src/components/history/HistoryStatsSection.tsx`). ' +
          'Composes the shared `@tahti-player/ui` HistoryCharts primitives (CalendarHeatmap, DayOfWeekChart, ListeningClock, TopList) exactly as production ' +
          'does — this story exists so the primitive stories (CalendarHeatmap.stories, DayOfWeekChart.stories, ListeningClock.stories, StatChip.stories) ' +
          'have an in-context counterpart showing how they actually get assembled.',
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
