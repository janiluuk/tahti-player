import { ArtistProfilePage } from './artist-view/ArtistProfilePage';

export { profileTrackToPlayable } from '../lib/artistProfile';

/** Keyed by username so navigating between artists resets all local state. */
export function ArtistView({ username }: { username: string }) {
  return <ArtistProfilePage key={username} username={username} />;
}
