import { createRoute, redirect } from '@tanstack/react-router';

import { appLayoutRoute } from './router-core';
import { HelpArticleView, HelpHubView } from './router-lazy-views';

export const helpRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help',
  component: HelpHubView,
});

export const helpSlugRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help/$slug',
  component: function HelpSlugRoute() {
    const { slug } = helpSlugRoute.useParams();
    return <HelpArticleView slug={slug} />;
  },
});

/** Old path — the governance guide moved into Studio → Governance's own
 * Guide tab, closer to where members actually use it. */
export const helpGovernanceRedirectRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/help/governance',
  beforeLoad: () => {
    throw redirect({ to: '/studio/governance', search: { tab: 'guide' } });
  },
});
