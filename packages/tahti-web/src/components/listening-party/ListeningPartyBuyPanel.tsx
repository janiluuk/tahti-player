import type { ListeningPartyDto } from '../../api/listening-parties';
import { useAuthStore } from '../../stores/authStore';
import { ArtistStoreSection } from '../artist-view/ArtistStoreSection';

/** The host's purchase tiers, bought through the same checkout as the
 * artist's own store. The API lists tiers only while the host's store is
 * open and can take payments. */
export function ListeningPartyBuyPanel({
  party,
}: {
  party: ListeningPartyDto;
}) {
  const me = useAuthStore((state) => state.user?.username ?? null);
  return (
    <ArtistStoreSection
      username={party.host.username}
      tiers={party.purchaseTiers}
      paymentsReady
      isOwner={me === party.host.username}
    />
  );
}
