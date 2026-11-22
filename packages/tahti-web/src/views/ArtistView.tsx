import { useRouterState } from '@tanstack/react-router';

import { artistSubdomainLabel } from '../lib/channelSubdomain';
import { ArtistProfilePage } from './artist-view/ArtistProfilePage';
import { useArtistProfileLoad } from './artist-view/useArtistProfileLoad';
import { LinkPageView } from './link-page/LinkPageView';

export { profileTrackToPlayable } from '../lib/artistProfile';

/** Production shared hosts that show the short Link page at `/u/:username`. */
function isLinkPageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'tahti.live' ||
    host === 'www.tahti.live' ||
    host === 'app.tahti.live' ||
    host === 'beta.tahti.live'
  );
}

function searchFullFlag(search: unknown): boolean {
  if (typeof search === 'string') {
    const params = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search,
    );
    return params.get('full') === '1';
  }
  if (search && typeof search === 'object') {
    const full = (search as Record<string, unknown>).full;
    return full === '1' || full === 1 || full === true;
  }
  return false;
}

function useShowShortLinkPage(username: string): boolean {
  const search = useRouterState({
    select: (s) => s.location.search,
  });
  if (searchFullFlag(search)) {
    return false;
  }
  const host =
    typeof window !== 'undefined' ? window.location.hostname : 'tahti.live';
  const subdomain = artistSubdomainLabel(host);
  if (subdomain && subdomain === username.toLowerCase()) {
    return false;
  }
  return isLinkPageHost(host);
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
