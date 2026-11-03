import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockSmartLink } from '@tahti-web/api/mock';
import type { SearchTrackResult } from '@tahti-web/api/search-types';
import type { RadioShowUpcomingTrack } from '@tahti-web/api/shows/public-show';
import type { PublicRadioShowEpisode } from '@tahti-web/api/shows/types';
import type { VenueRecording } from '@tahti-web/api/types';
import { ImportJobsPanel } from '@tahti-web/components/ImportJobsPanel';
import { MultistreamStatusPanel } from '@tahti-web/components/MultistreamStatusPanel';
import { RadioUpNextPanel } from '@tahti-web/components/RadioUpNextPanel';
import { ReleaseTrackDownloads } from '@tahti-web/components/ReleaseTrackDownloads';
import { SearchTrackResults } from '@tahti-web/components/SearchTrackResults';
import { ShowEpisodeList } from '@tahti-web/components/ShowEpisodeList';
import { UsernameAvailabilityHint } from '@tahti-web/components/UsernameAvailabilityHint';
import { VenueRecordings } from '@tahti-web/components/VenueRecordings';
import { expect, fn, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const TRACKS: SearchTrackResult[] = [
  {
    id: 'demo-archive-1',
    title: 'Midnight Broadcast',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    durationSec: 312,
    coverUrl: null,
  },
  {
    id: 'demo-archive-2',
    title: 'Archive Session 02',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    durationSec: 1840,
    coverUrl: null,
  },
];

const EPISODES: PublicRadioShowEpisode[] = [
  {
    id: 'ep-1',
    startAt: '2026-11-07T20:00:00.000Z',
    endAt: '2026-11-07T22:00:00.000Z',
    note: null,
    showType: 'LIVE_SET',
    title: 'Friday Frequency — Episode 4',
  },
];

const UP_NEXT: RadioShowUpcomingTrack[] = [
  {
    id: 'r1',
    title: 'Night Transit',
    artistName: 'Aino Virta',
    artistUsername: null,
    artworkUrl: null,
  },
  {
    id: 'r2',
    title: 'Signal Bloom',
    artistName: 'Lumo Collective',
    artistUsername: null,
    artworkUrl: null,
  },
];

const RECORDINGS: VenueRecording[] = [
  {
    id: 'vr1',
    title: 'Live at Kuudes Linja',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    durationSec: 3600,
    coverUrl: null,
    releasedAt: '2026-10-01T00:00:00.000Z',
  },
];

const meta: Meta = {
  title: 'Tahti/Components/Listing pieces',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Search track results, show episodes, radio up next, venue recordings, release downloads, the username hint, import jobs and multistream status.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

export const SearchResults: Story = {
  render: () => <SearchTrackResults tracks={TRACKS} />,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Midnight Broadcast'),
    ).toBeVisible();
  },
};

export const ShowEpisodes: Story = {
  render: () => (
    <ShowEpisodeList
      title="Upcoming episodes"
      episodes={EPISODES}
      channelSlug="northern-lights"
    />
  ),
};

export const RadioUpNext: Story = {
  render: () => (
    <RadioUpNextPanel onRotation rotation={UP_NEXT} onRetryRotation={fn()} />
  ),
};

export const Recordings: Story = {
  render: () => <VenueRecordings recordings={RECORDINGS} />,
};

export const ReleaseDownloads: Story = {
  render: () => {
    const link = mockSmartLink('northern-lights-release-1');
    return (
      <ReleaseTrackDownloads
        smartLinkSlug="northern-lights-release-1"
        tracks={link.release.tracks}
      />
    );
  },
};

export const UsernameTaken: Story = {
  render: () => (
    <UsernameAvailabilityHint
      username="northern-lights"
      availability={{
        available: false,
        suggestions: ['northern-lights-music', 'northernlights'],
      }}
      onPick={fn()}
    />
  ),
};

export const ImportJobs: Story = { render: () => <ImportJobsPanel /> };

export const MultistreamStatus: Story = {
  render: () => <MultistreamStatusPanel />,
};
