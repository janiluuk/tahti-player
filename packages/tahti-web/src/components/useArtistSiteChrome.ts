import type { CSSProperties } from 'react';

import { isArtistSubdomainPage } from '../lib/channelSubdomain';
import { normalizeColorScheme } from '../lib/colorScheme';
import { useChannelChromeStore } from '../stores/channelChromeStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';

export function useArtistSiteChrome(pathname: string) {
  const artistSite = isArtistSubdomainPage(window.location.hostname, pathname);
  const channel = useChannelChromeStore((state) => state.channel);
  const hasRailOverride = useRightRailOverrideStore((state) =>
    Boolean(state.override),
  );
  const scheme = normalizeColorScheme(channel?.colorScheme);
  const theme = artistSite
    ? ({
        '--background': scheme.bg,
        '--background-secondary': scheme.bg,
        '--foreground': scheme.text,
        '--foreground-secondary': scheme.muted,
        '--primary': scheme.accent,
        '--primary-foreground': scheme.bg,
        '--border': scheme.accent,
      } as CSSProperties)
    : undefined;
  return {
    artistSite,
    channel,
    theme,
    hideSidebar: artistSite && channel?.showSiteSidebar !== true,
    hideBottomBar: artistSite && channel?.showSiteBottomBar !== true,
    showRightRail: !artistSite || hasRailOverride,
  };
}
