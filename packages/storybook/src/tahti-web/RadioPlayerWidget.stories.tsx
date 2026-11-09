import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  mockChannel,
  mockRadioRecentlyPlayed,
  TAHTI_RADIO_SLUG,
} from '@tahti-web/api/mock';
import type { RadioFeatureHistoryItem } from '@tahti-web/api/radio-public';
import type { RadioShowUpcomingTrack } from '@tahti-web/api/shows';
import { PageEmpty } from '@tahti-web/components/PageStates';
import { RadioBookedShowsPanel } from '@tahti-web/components/radio/RadioBookedShowsPanel';
import { RadioFeaturedPanel } from '@tahti-web/components/radio/RadioFeaturedPanel';
import {
  RadioPlayButton,
  RadioStationActions,
} from '@tahti-web/components/radio/RadioHeroControls';
import { RadioJustPlayedPanel } from '@tahti-web/components/radio/RadioJustPlayedPanel';
import { RadioNowPlayingOverlay } from '@tahti-web/components/radio/RadioNowPlayingOverlay';
import { RadioPlayerWidget } from '@tahti-web/components/radio/RadioPlayerWidget';
import { RadioUpNextPanel } from '@tahti-web/components/RadioUpNextPanel';
import {
  CalendarDaysIcon,
  HistoryIcon,
  ListOrderedIcon,
  MicIcon,
} from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

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
  expanded = true,
}: {
  online?: boolean;
  playing?: boolean;
  expanded?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(playing);
  const [favorited, setFavorited] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <RadioPlayerWidget
        station={STATION}
        logoUrl={STATION.user.avatarUrl}
        artworkUrl="https://picsum.photos/seed/polar/400/400"
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
              artworkUrl: 'https://picsum.photos/seed/polar/400/400',
            }}
            next={{
              title: 'Night Transit',
              subtitle: 'Aino Virta',
            }}
          />
        }
        playControl={
          <RadioPlayButton
            playing={isPlaying}
            playLabel="Play Radio"
            pauseLabel="Pause Radio"
            onToggle={() => setIsPlaying((v) => !v)}
          />
        }
        actions={
          <RadioStationActions
            favorited={favorited}
            favoriteLabel="Add to favorites"
            unfavoriteLabel="Remove from favorites"
            onToggleFavorite={() => setFavorited((v) => !v)}
            channelSlug={TAHTI_RADIO_SLUG}
            openChannelLabel="Open channel"
          />
        }
        selectedTabIndex={tab}
        onTabChange={setTab}
        defaultExpanded={expanded}
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
          'Consolidated Tahti Radio surface: visualizer + now playing + play/favorite, with Up next / Shows / Just played / Featured tabs in the same card. Starts minimized on `/radio` (a short now-playing strip); the corner button expands it.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/radio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimized: Story = {
  render: () => <DemoWidget expanded={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByTestId('radio-player-widget-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByTestId('radio-now-playing-overlay')).toBeVisible();
    await expect(canvas.queryByRole('tab', { name: /Up next/ })).toBeNull();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('tab', { name: /Up next/ })).toBeVisible();
  },
};

export const OnAir: Story = {
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('radio-player-widget')).toBeVisible();
    await expect(canvas.getByTestId('radio-visualizer-hero')).toBeVisible();
    await expect(canvas.getByTestId('radio-now-playing-overlay')).toBeVisible();
    // The first tab's panel fades in from opacity 0; on a busy shard that
    // can outlast waitFor's 1s default.
    await waitFor(
      () => expect(canvas.getByTestId('radio-up-next-rotation')).toBeVisible(),
      { timeout: 5_000 },
    );
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
    const featured = canvas.getByTestId('radio-featured');
    await expect(featured).toBeInTheDocument();
    await expect(
      within(featured).getByRole('link', { name: 'Northern Lights' }),
    ).toBeInTheDocument();
  },
};

export const PlayToggle: Story = {
  name: 'Play / pause',
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Play Radio' }));
    const pause = canvas.getByRole('button', { name: 'Pause Radio' });
    await expect(pause).toBeVisible();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await expect(pause.querySelector('svg')).not.toBeNull();
  },
};

export const FavoriteToggle: Story = {
  name: 'Favorite on and off',
  render: () => <DemoWidget />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add to favorites' }),
    );
    const remove = canvas.getByRole('button', {
      name: 'Remove from favorites',
    });
    await expect(remove).toBeEnabled();
    await userEvent.click(remove);
    await expect(
      canvas.getByRole('button', { name: 'Add to favorites' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open channel' }),
    ).toHaveAttribute('href', expect.stringContaining('view=channel'));
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
