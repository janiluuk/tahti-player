import { createRoute, redirect } from '@tanstack/react-router';

import { ButtonLink } from '@tahti-player/ui';

import { PageEmpty } from '../components/PageStates';
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

/** Any address no other route claims. It lives under the app layout so the
 * sidebar, top bar and player stay on screen instead of a bare error. */
export const notFoundRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '$',
  component: () => (
    <PageEmpty
      icon="alert"
      title="Page not found"
      description="There is nothing at this address. It may have moved or been removed."
      action={
        <ButtonLink to="/" size="sm" variant="secondary">
          Back to Listen
        </ButtonLink>
      }
    />
  ),
});
