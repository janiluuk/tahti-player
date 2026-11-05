import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  mockChannel,
  mockRadioRecentlyPlayed,
  TAHTI_RADIO_SLUG,
} from '@tahti-web/api/mock';
import type { RadioFeatureHistoryItem } from '@tahti-web/api/radio-public';
import type { RadioShowUpcomingTrack } from '@tahti-web/api/shows';
import { MediaIconActions } from '@tahti-web/components/MediaIconActions';
import { PageEmpty } from '@tahti-web/components/PageStates';
import { RadioBookedShowsPanel } from '@tahti-web/components/radio/RadioBookedShowsPanel';
import { RadioFeaturedPanel } from '@tahti-web/components/radio/RadioFeaturedPanel';
import { RadioJustPlayedPanel } from '@tahti-web/components/radio/RadioJustPlayedPanel';
import { RadioNowPlayingOverlay } from '@tahti-web/components/radio/RadioNowPlayingOverlay';
import { RadioPlayerWidget } from '@tahti-web/components/radio/RadioPlayerWidget';
import { RadioUpNextPanel } from '@tahti-web/components/RadioUpNextPanel';
import {
  CalendarDaysIcon,
  HeartIcon,
  HistoryIcon,
  ListOrderedIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const STATION = mockChannel(TAHTI_RADIO_SLUG);

const ROTATION: RadioShowUpcomingTrack[] = [
  {
    id: 'r1',
    title: 'Night Transit',
    artistName: 'Aino Virta',
    artistUsername: 'aino-virta',
    artworkUrl: null,
  },
  {
    id: 'r2',
    title: 'Signal Bloom',
    artistName: 'Lumo Collective',
    artistUsername: null,
    artworkUrl: null,
  },
  {
    id: 'r3',
    title: 'Harbour Lights',
    artistName: 'Kuudes Linja',
    artistUsername: null,
    artworkUrl: null,
  },
];

const FEATURED: RadioFeatureHistoryItem[] = [
  {
    channelId: 'ch-1',
    slug: 'northern-lights',
    artistName: 'Northern Lights',
    featuredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    channelId: 'ch-2',
    slug: 'midnight-cartography',
    artistName: 'Midnight Cartography',
    featuredAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
];

const RECENT = mockRadioRecentlyPlayed().slice(0, 3);

function DemoWidget({
  online = true,
  playing = false,
}: {
  online?: boolean;
  playing?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(playing);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <RadioPlayerWidget
        station={STATION}
        logoUrl={STATION.user.avatarUrl}
        online={online}
        offlineContent={
          <PageEmpty
            icon="radio"
            title="Off air"
            description="Tahti Radio is offline right now."
          />
        }
        info={
          <RadioNowPlayingOverlay
            label="Now playing"
            current={{
              title: 'Aurora Drift',
              subtitle: 'Northern Lights',
              artworkUrl: null,
            }}
            next={{
              title: 'Night Transit',
              subtitle: 'Aino Virta',
            }}
          />
        }
        actions={
          <MediaIconActions
            actions={[
              {
                id: 'play',
                label: isPlaying ? 'Pause Radio' : 'Play Radio',
                icon: isPlaying ? (
                  <PauseIcon size={16} className="fill-current" />
                ) : (
                  <PlayIcon size={16} className="fill-current" />
                ),
                onClick: () => setIsPlaying((v) => !v),
                active: isPlaying,
                disableWhenActive: false,
              },
              {
                id: 'favorite',
                label: 'Favorite',
                icon: <HeartIcon size={16} />,
                onClick: fn(),
                variant: 'text',
              },
            ]}
          />
        }
        selectedTabIndex={tab}
        onTabChange={setTab}
        tabs={[
          {
            id: 'up-next',
            label: 'Up next',
            icon: <ListOrderedIcon size={14} />,
            count: ROTATION.length,
            content: (
              <RadioUpNextPanel
                onRotation
                rotation={ROTATION}
                onRetryRotation={fn()}
              />
            ),
          },
          {
            id: 'shows',
            label: 'Shows',
            icon: <CalendarDaysIcon size={14} />,
            content: <RadioBookedShowsPanel bookings={[]} onRetry={fn()} />,
          },
          {
            id: 'just-played',
            label: 'Just played',
            icon: <HistoryIcon size={14} />,
            count: RECENT.length,
            content: (
              <RadioJustPlayedPanel
                items={RECENT}
                onRetry={fn()}
                handlers={{
                  currentId: null,
                  playerStatus: 'idle',
                  queueIds: new Set(),
                  onPlay: fn(),
                  onTogglePause: fn(),
                  onQueue: fn(),
                  onTrackInfo: fn(),
                }}
              />
            ),
          },
          {
            id: 'featured',
            label: 'Featured',
            icon: <MicIcon size={14} />,
            count: FEATURED.length,
            content: <RadioFeaturedPanel items={FEATURED} onRetry={fn()} />,
          },
        ]}
      />
    </div>
  );
}

const meta: Meta<typeof RadioPlayerWidget> = {
  title: 'Tahti/Radio/RadioPlayerWidget',
  component: RadioPlayerWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Consolidated Tahti Radio surface: visualizer + now playing + play/favorite, with Up next / Shows / Just played / Featured tabs in the same card. Used on `/radio`.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/radio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OnAir: Story = {
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('radio-player-widget')).toBeVisible();
    await expect(canvas.getByTestId('radio-visualizer-hero')).toBeVisible();
    await expect(canvas.getByTestId('radio-now-playing-overlay')).toBeVisible();
    await expect(canvas.getByTestId('radio-up-next-rotation')).toBeVisible();
  },
};

export const JustPlayedTab: Story = {
  name: 'Just played tab',
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, /Just played/);
    await expect(canvas.getByTestId('radio-just-played')).toBeVisible();
    await expect(canvas.getByText('Route 550')).toBeVisible();
  },
};

export const FeaturedTab: Story = {
  name: 'Featured tab',
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, /Featured/);
    await expect(canvas.getByTestId('radio-featured')).toBeVisible();
    await expect(canvas.getByText('Northern Lights')).toBeVisible();
  },
};

export const PlayToggle: Story = {
  name: 'Play / pause',
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Play Radio' }));
    await expect(
      canvas.getByRole('button', { name: 'Pause Radio' }),
    ).toBeVisible();
  },
};

export const Offline: Story = {
  render: () => <DemoWidget online={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId('radio-player-widget-offline'),
    ).toBeVisible();
    await expect(canvas.getByText('Off air')).toBeVisible();
    await expect(canvas.queryByTestId('radio-visualizer-hero')).toBeNull();
    await selectTab(canvas, /Just played/);
    await expect(canvas.getByTestId('radio-just-played')).toBeVisible();
  },
};
