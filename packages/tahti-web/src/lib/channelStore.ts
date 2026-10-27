import { isForceMock } from '../api/mode';
import {
  readMockStorefront,
  type PublicStoreTier,
} from '../api/purchase-tiers';
import type { PublicProfile, PublicProfileTrack } from '../api/types';

export type StoreListing = {
  id: string;
  title: string;
  tierId: string;
};

export type ChannelStorefront = {
  tiers: PublicStoreTier[];
  paymentsReady: boolean;
  items: StoreListing[];
};

export function storeListingsFromTracks(
  tracks: Array<
    Pick<PublicProfileTrack, 'id' | 'title'> & {
      accessMode?: string;
      purchaseTierId?: string | null;
    }
  >,
): StoreListing[] {
  return tracks.flatMap((track) =>
    track.accessMode === 'PURCHASE' && track.purchaseTierId
      ? [{ id: track.id, title: track.title, tierId: track.purchaseTierId }]
      : [],
  );
}

export function resolveStorefront(profile: PublicProfile): ChannelStorefront {
  const fromProfile: ChannelStorefront = {
    tiers: profile.purchaseTiers ?? [],
    paymentsReady: profile.storePaymentsReady !== false,
    items: storeListingsFromTracks(profile.tracks),
  };
  if (!isForceMock()) {
    return fromProfile;
  }
  const mock = readMockStorefront(profile.artist.username);
  if (!mock.storeEnabled) {
    return fromProfile;
  }
  return {
    tiers: mock.tiers,
    paymentsReady: true,
    items: mock.items,
  };
}
