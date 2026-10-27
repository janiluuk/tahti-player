import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import {
  DiscussionsView,
  DiscussionTopicView,
  FeatureRequestsView,
  GovernanceMeetingDetailView,
  GovernanceMembersView,
  GovernanceMotionDetailView,
  GovernanceView,
  PublicGovernanceHistoryView,
} from './router-lazy-views';

export const governanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance',
  component: GovernanceView,
});

export const governanceMembersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/members',
  component: GovernanceMembersView,
});

export const governanceMeetingDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/meetings/$id',
  component: function GovernanceMeetingDetailRoute() {
    const { id } = governanceMeetingDetailRoute.useParams();
    return <GovernanceMeetingDetailView id={id} />;
  },
});

export const governanceMotionDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/motions/$id',
  component: function GovernanceMotionDetailRoute() {
    const { id } = governanceMotionDetailRoute.useParams();
    return <GovernanceMotionDetailView id={id} />;
  },
});

export const publicGovernanceHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/history',
  component: PublicGovernanceHistoryView,
});

export const featureRequestsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/feature-requests',
  component: FeatureRequestsView,
});

export const discussionsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/discussions',
  component: DiscussionsView,
});

export const discussionTopicRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/governance/discussions/$id',
  component: function DiscussionTopicRoute() {
    const { id } = discussionTopicRoute.useParams();
    return <DiscussionTopicView id={id} />;
  },
});
