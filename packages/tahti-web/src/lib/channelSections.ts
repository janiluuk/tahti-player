/** Studio → Broadcast → Channel is one page of sections (`#radio`,
 * `#green-room`, `#selects`); the Radio section's own tabs live in
 * `?radio=`. Old `?tab=` links redirect here. */
export const CHANNEL_RADIO_TABS = [
  'stream',
  'rotation',
  'pinned',
  'tahti-radio',
  'multicast',
] as const;

export type ChannelRadioTab = (typeof CHANNEL_RADIO_TABS)[number];

export type ChannelSection = 'radio' | 'green-room' | 'selects';

export const isChannelRadioTab = (value: unknown): value is ChannelRadioTab =>
  (CHANNEL_RADIO_TABS as readonly unknown[]).includes(value);

export type ChannelTabRedirect =
  | {
      to: '/studio/channel';
      search: { radio?: ChannelRadioTab };
      hash?: ChannelSection;
      replace: true;
    }
  | {
      to: '/settings/$section';
      params: { section: 'channel' | 'artist' };
      search?: { tab: 'branding' };
      replace: true;
    };

/** Where an old `/studio/channel?tab=…` link goes now, or null when the
 * address needs no redirect. */
export function channelTabRedirect(
  tab: string | undefined,
): ChannelTabRedirect | null {
  if (tab === undefined) {
    return null;
  }
  if (tab === 'design') {
    return {
      to: '/settings/$section',
      params: { section: 'channel' },
      replace: true,
    };
  }
  if (tab === 'profile') {
    return {
      to: '/settings/$section',
      params: { section: 'artist' },
      search: { tab: 'branding' },
      replace: true,
    };
  }
  if (tab === 'radio' || tab === 'stream') {
    return { to: '/studio/channel', search: {}, hash: 'radio', replace: true };
  }
  if (tab === 'announcements') {
    return {
      to: '/studio/channel',
      search: { radio: 'rotation' },
      hash: 'radio',
      replace: true,
    };
  }
  if (isChannelRadioTab(tab)) {
    return {
      to: '/studio/channel',
      search: { radio: tab },
      hash: 'radio',
      replace: true,
    };
  }
  if (tab === 'green-room' || tab === 'selects') {
    return { to: '/studio/channel', search: {}, hash: tab, replace: true };
  }
  return { to: '/studio/channel', search: {}, replace: true };
}

/** In-app path of a Radio section tab, e.g. for links and redirects. */
export function channelRadioPath(tab: ChannelRadioTab = 'stream'): string {
  return tab === 'stream'
    ? '/studio/channel#radio'
    : `/studio/channel?radio=${tab}#radio`;
}
