import { createRoute, redirect } from '@tanstack/react-router';

import {
  appendSearchParams,
  resolveDashboardCallbackRedirect,
} from '../lib/cutoverReturns';
import { resolveDashboardRedirect } from '../lib/prodPathRedirects';
import { useAuthStore } from '../stores/authStore';
import { DashboardAliasView } from '../views/DashboardAliasView';
import {
  EmbedChannelView,
  EmbedCollectionView,
  EmbedReleaseView,
} from '../views/EmbedViews';
import { appLayoutRoute, rootRoute } from './router-core';

export const embedChannelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/c/$slug',
  component: function EmbedChannelRoute() {
    const { slug } = embedChannelRoute.useParams();
    return <EmbedChannelView slug={slug} />;
  },
});

export const embedReleaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/r/$id',
  component: function EmbedReleaseRoute() {
    const { id } = embedReleaseRoute.useParams();
    return <EmbedReleaseView id={id} />;
  },
});

/** Matches Tahti `/embed/col/:slug` + API `GET /api/v1/embed/col/:slug`. */
export const embedColRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/col/$slug',
  component: function EmbedColRoute() {
    const { slug } = embedColRoute.useParams();
    return <EmbedCollectionView slug={slug} />;
  },
});

/** Friendly alias aligned with public collection URLs. */
export const embedUserColRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/embed/u/$username/c/$slug',
  component: function EmbedUserColRoute() {
    const { username, slug } = embedUserColRoute.useParams();
    return <EmbedCollectionView slug={slug} username={username} />;
  },
});

/** Production path aliases — tahti.live URLs keep working on the Nuclear SPA. */
export const listenAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/listen',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

export const prodChannelAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/c/$slug',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/channel/$slug',
      params: { slug: params.slug },
    });
  },
});

export const prodSubscribeAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/u/$username/subscribe',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/subscribe/$username',
      params: { username: params.username },
    });
  },
});

export const dashboardIndexAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardAliasView,
});

function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.getState().hydrated) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.hydrated) {
        unsub();
        resolve();
      }
    });
  });
}

const OAUTH_IMPORT_STATUS_KEYS: Record<string, string> = {
  soundcloud: 'sc',
  bandcamp: 'bc',
  'google-drive': 'gd',
};

export const dashboardSplatAliasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard/$',
  beforeLoad: async ({ params, search }) => {
    const splat =
      typeof params._splat === 'string'
        ? params._splat
        : String((params as { _splat?: string })._splat ?? '');
    // This route also matches bare `/dashboard` (empty splat) ahead of the
    // `/dashboard` index route — apply the same artist-vs-listener split
    // here instead of falling through to the `''` → `/studio` prod alias.
    if (!splat.replace(/^\/+|\/+$/g, '')) {
      const callbackRedirect = resolveDashboardCallbackRedirect(
        search as Record<string, unknown>,
      );
      if (callbackRedirect) {
        throw redirect({ href: callbackRedirect });
      }
      await waitForAuthHydration();
      const user = useAuthStore.getState().user;
      throw redirect({ href: user?.channel ? '/studio' : '/feed' });
    }
    // Prod's OAuth import callback (SoundCloud/Bandcamp/Google Drive) lands
    // on `/dashboard/upload/import/:provider?sc=|bc=|gd=connected|error|login`
    // — route straight to the matching Sources tab with the status intact.
    const importMatch = /^upload\/import\/([\w-]+)/.exec(splat);
    if (importMatch?.[1] && OAUTH_IMPORT_STATUS_KEYS[importMatch[1]]) {
      const provider = importMatch[1];
      const statusKey = OAUTH_IMPORT_STATUS_KEYS[provider]!;
      const status = (search as Record<string, unknown>)[statusKey];
      throw redirect({
        to: '/sources/$id',
        params: { id: provider },
        search: typeof status === 'string' ? { status } : undefined,
      });
    }
    throw redirect({
      href: appendSearchParams(
        resolveDashboardRedirect(splat),
        search as Record<string, unknown>,
      ),
    });
  },
});
