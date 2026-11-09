import { useEffect } from 'react';
import { create } from 'zustand';

import type { PublicChannel } from '../api/types';

type ChannelChromeState = {
  channel: PublicChannel | null;
  setChannel: (channel: PublicChannel | null) => void;
};

export const useChannelChromeStore = create<ChannelChromeState>((set) => ({
  channel: null,
  setChannel: (channel) => set({ channel }),
}));

/** Shares the open channel with the app shell (ArtistSiteHeader, site chrome
 * visibility) while the channel page is mounted. */
export function usePublishChannelChrome(channel: PublicChannel | null) {
  useEffect(() => {
    useChannelChromeStore.getState().setChannel(channel);
    return () => useChannelChromeStore.getState().setChannel(null);
  }, [channel]);
}
