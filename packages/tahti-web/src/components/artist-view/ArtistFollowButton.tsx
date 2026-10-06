import { FavoriteButton } from '@tahti-player/ui';

import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';

/** Follow heart on the artist page. A visitor with no account gets the
 * sign-in dialog instead of a missing button. */
export function ArtistFollowButton({
  displayName,
  following,
  busy,
  onToggle,
}: {
  displayName: string;
  following: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  return (
    <FavoriteButton
      size="sm"
      isFavorite={signedIn && following}
      disabled={busy}
      onToggle={() =>
        signedIn ? onToggle() : useAuthModalStore.getState().open('login')
      }
      ariaLabelAdd={
        signedIn ? `Follow ${displayName}` : `Log in to follow ${displayName}`
      }
      ariaLabelRemove={`Unfollow ${displayName}`}
      className="bg-background border-border rounded-md border-(length:--border-width)"
      data-testid="artist-favorite-button"
    />
  );
}
