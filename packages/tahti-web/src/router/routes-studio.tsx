import { createRoute, redirect } from '@tanstack/react-router';

import { StudioPlaylistEditorView } from '../views/studio/playlists/StudioPlaylistEditorView';
import { StudioBrandingView } from '../views/studio/StudioBrandingView';
import { StudioChannelView } from '../views/studio/StudioChannelView';
import { StudioCollectionsView } from '../views/studio/StudioCollectionsView';
import { StudioEditorListView } from '../views/studio/StudioEditorListView';
import { StudioEditorProjectView } from '../views/studio/StudioEditorProjectView';
import { StudioEventsView } from '../views/studio/StudioEventsView';
import { StudioGoLiveView } from '../views/studio/StudioGoLiveView';
import { StudioHomeView } from '../views/studio/StudioHomeView';
import { StudioReleaseDetailView } from '../views/studio/StudioReleaseDetailView';
import { StudioReleasesView } from '../views/studio/StudioReleasesView';
import { StudioScheduleView } from '../views/studio/StudioScheduleView';
import { StudioSetupChannelRedirect } from '../views/studio/StudioSetupChannelRedirect';
import { StudioShowsView } from '../views/studio/StudioShowsView';
import { StudioSoundsView } from '../views/studio/StudioSoundsView';
import { StudioStatsDetailView } from '../views/studio/StudioStatsDetailView';
import { StudioStatsView } from '../views/studio/StudioStatsView';
import { StudioUploadView } from '../views/studio/StudioUploadView';
import { appLayoutRoute } from './router-core';
import {
  StudioCollectionEditView,
  StudioDistributionView,
  StudioEpisodeReviewView,
  StudioEventCreateView,
  StudioGovernanceView,
  StudioMasteringView,
  StudioProEditorView,
  StudioRevenueView,
  StudioShowDetailView,
  StudioSoundView,
  StudioStripeView,
  StudioTrackInsightsView,
  StudioUpdatesView,
} from './router-lazy-views';

export const studioRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio',
  component: StudioHomeView,
});

export const studioGoLiveRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/go-live',
  component: StudioGoLiveView,
});

export const studioBroadcastInfoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/info',
  beforeLoad: () => {
    throw redirect({ to: '/studio/go-live' });
  },
});

export const studioSoundsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds',
  component: StudioSoundsView,
});

/** Old path, kept as a redirect — linked from bookmarks, old shares, and
 * the "archive" naming this page used before the Sounds rename. */
export const studioArchiveRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive',
  beforeLoad: () => {
    throw redirect({ to: '/studio/sounds' });
  },
});

/** Old path — Recordings is now a Library tab, not a Studio one. */
export const studioRecordingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/recordings',
  beforeLoad: () => {
    throw redirect({ to: '/library/recordings' });
  },
});

export const studioSoundItemRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds/$id',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'details' | 'playlists' | 'insights' } => ({
    tab:
      search.tab === 'details' ||
      search.tab === 'playlists' ||
      search.tab === 'insights'
        ? search.tab
        : undefined,
  }),
  component: function StudioSoundItemRoute() {
    const { id } = studioSoundItemRoute.useParams();
    return <StudioSoundView key={id} id={id} />;
  },
});

export const studioArchiveItemRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/studio/sounds/$id', params });
  },
});

export const studioSoundEditorRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/sounds/$id/editor',
  component: function StudioSoundEditorRoute() {
    const { id } = studioSoundEditorRoute.useParams();
    return <StudioProEditorView soundId={id} />;
  },
});

export const studioArchiveEditorRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/archive/$id/editor',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/studio/sounds/$id/editor', params });
  },
});

export const studioMasteringRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/mastering/$id',
  component: function StudioMasteringRoute() {
    const { id } = studioMasteringRoute.useParams();
    return <StudioMasteringView soundId={id} />;
  },
});

export const studioReleasesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/releases',
  validateSearch: (search: Record<string, unknown>): { create?: boolean } => ({
    create:
      search.create === true || search.create === 'true' ? true : undefined,
  }),
  component: StudioReleasesView,
});

export const studioReleaseDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/releases/$id',
  component: function StudioReleaseDetailRoute() {
    const { id } = studioReleaseDetailRoute.useParams();
    return <StudioReleaseDetailView id={id} />;
  },
});

export const studioCollectionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/collections',
  component: StudioCollectionsView,
});

export const studioCollectionEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/collections/$slug',
  component: function StudioCollectionEditRoute() {
    const { slug } = studioCollectionEditRoute.useParams();
    return <StudioCollectionEditView slug={slug} />;
  },
});

export const studioUploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/upload',
  beforeLoad: () => {
    throw redirect({ to: '/library/upload' });
  },
});

export const libraryUploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/library/upload',
  component: StudioUploadView,
});

export const studioEditorRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/editor',
  component: StudioEditorListView,
});

export const studioEditorProjectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/editor/$id',
  component: function StudioEditorProjectRoute() {
    const { id } = studioEditorProjectRoute.useParams();
    return <StudioEditorProjectView id={id} />;
  },
});

/** Old path — Stash is now a Library tab, not a Studio one. */
export const studioStashRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stash',
  beforeLoad: () => {
    throw redirect({ to: '/library/stash' });
  },
});

export const studioScheduleRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/schedule',
  component: StudioScheduleView,
});

export const studioStatsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stats',
  component: StudioStatsView,
});

export const studioGovernanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/governance',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'topics' | 'guide' } => ({
    tab:
      search.tab === 'topics' || search.tab === 'feature-requests'
        ? 'topics'
        : search.tab === 'guide'
          ? 'guide'
          : undefined,
  }),
  component: function StudioGovernanceRoute() {
    const search = studioGovernanceRoute.useSearch();
    return <StudioGovernanceView tab={search.tab ?? 'motions'} />;
  },
});

export const studioStatsDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stats/detail',
  component: StudioStatsDetailView,
});

export const studioSetupChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/setup-channel',
  component: StudioSetupChannelRedirect,
});

export const studioChannelRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/channel',
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: StudioChannelView,
});

export const studioBrandingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/branding',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'gallery' | 'press-kit' | 'channel-designer' } => ({
    tab:
      search.tab === 'gallery' ||
      search.tab === 'press-kit' ||
      search.tab === 'channel-designer'
        ? search.tab
        : undefined,
  }),
  component: StudioBrandingView,
});

export const studioShowsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows',
  component: StudioShowsView,
});

export const studioShowDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows/$id',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'overview' | 'episodes' | 'recordings' } => ({
    tab:
      search.tab === 'overview' ||
      search.tab === 'episodes' ||
      search.tab === 'recordings'
        ? search.tab
        : undefined,
  }),
  component: function StudioShowDetailRoute() {
    const { id } = studioShowDetailRoute.useParams();
    return <StudioShowDetailView id={id} />;
  },
});

export const studioEpisodeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/shows/episodes/$episodeId',
  component: function StudioEpisodeRoute() {
    const { episodeId } = studioEpisodeRoute.useParams();
    return <StudioEpisodeReviewView episodeId={episodeId} />;
  },
});

export const studioPlaylistsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/playlists',
  beforeLoad: () => {
    throw redirect({ to: '/studio/collections' });
  },
});

export const studioPlaylistEditRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/playlists/$slug',
  component: function StudioPlaylistEditRoute() {
    const { slug } = studioPlaylistEditRoute.useParams();
    return <StudioPlaylistEditorView slug={slug} />;
  },
});

export const studioUpdatesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/updates',
  component: StudioUpdatesView,
});

export const studioAudienceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/audience',
  validateSearch: (search: Record<string, unknown>): { tab?: 'tiers' } => ({
    tab: search.tab === 'tiers' ? 'tiers' : undefined,
  }),
  component: StudioRevenueView,
});

export const studioRevenueRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/revenue',
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/studio/audience',
      search:
        typeof search === 'object' &&
        search &&
        'tab' in search &&
        (search as { tab?: unknown }).tab === 'tiers'
          ? { tab: 'tiers' as const }
          : {},
    });
  },
});

export const studioStripeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/stripe',
  component: StudioStripeView,
});

export const studioDistributionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/distribution',
  component: StudioDistributionView,
});

export const studioModerationRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/moderation',
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$section',
      params: { section: 'channel' },
    });
  },
});

export const studioVenuesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/venues',
  beforeLoad: () => {
    throw redirect({ to: '/admin/venues' });
  },
});

export const studioEventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events',
  component: StudioEventsView,
});

export const studioEventCreateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/events/new',
  component: StudioEventCreateView,
});

export const studioInsightsIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/insights',
  component: StudioStatsDetailView,
});

export const studioInsightsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/studio/insights/$kind/$id',
  component: function StudioInsightsRoute() {
    const { kind, id } = studioInsightsRoute.useParams();
    return (
      <StudioTrackInsightsView
        kind={kind === 'release-tracks' ? 'release-tracks' : 'sound'}
        id={id}
      />
    );
  },
});
