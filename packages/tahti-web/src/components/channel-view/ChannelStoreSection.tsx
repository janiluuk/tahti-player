import type { ChannelStorefront } from '../../lib/channelStore';
import { ArtistStoreSection } from '../artist-view/ArtistStoreSection';

type Props = {
  storefront: ChannelStorefront | null;
  username: string;
  isOwner: boolean;
  hidden: boolean;
};

export function ChannelStoreSection({
  storefront,
  username,
  isOwner,
  hidden,
}: Props) {
  if (hidden || !storefront || storefront.tiers.length === 0) {
    return null;
  }
  return (
    <ArtistStoreSection
      username={username}
      tiers={storefront.tiers}
      items={storefront.items}
      paymentsReady={storefront.paymentsReady}
      isOwner={isOwner}
    />
  );
}
