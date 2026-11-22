import { useRouterState } from '@tanstack/react-router';

import { artistSubdomainLabel, isApexHost } from '../lib/channelSubdomain';
import { ArtistProfilePage } from './artist-view/ArtistProfilePage';
import { useArtistProfileLoad } from './artist-view/useArtistProfileLoad';
import { LinkPageView } from './link-page/LinkPageView';

export { profileTrackToPlayable } from '../lib/artistProfile';

function useShowShortLinkPage(username: string): boolean {
  const search = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  if (search.full === '1' || search.full === 1 || search.full === true) {
    return false;
  }
  const host =
    typeof window !== 'undefined' ? window.location.hostname : 'tahti.live';
  const subdomain = artistSubdomainLabel(host);
  if (subdomain && subdomain === username.toLowerCase()) {
    return false;
  }
  return isApexHost(host);
}

/** Keyed by username so navigating between artists resets all local state.
 * Apex `/u/:username` is the short Link page; `username.tahti.live/u/:username`
 * (and `?full=1`) is the full artist page. */
export function ArtistView({ username }: { username: string }) {
  const short = useShowShortLinkPage(username);
  if (short) {
    return <ArtistLinkPage key={username} username={username} />;
  }
  return <ArtistProfilePage key={username} username={username} />;
}

function ArtistLinkPage({ username }: { username: string }) {
  const { profile, loading, loadError, retry } = useArtistProfileLoad(
    username,
    false,
  );
  return (
    <LinkPageView
      profile={profile}
      loading={loading}
      error={loadError}
      onRetry={retry}
    />
  );
}
