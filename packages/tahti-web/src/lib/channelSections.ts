/** Studio → Broadcast → Channel is 24/7 radio (Stream · Pinned · Multicast).
 * Programme, stats, green room and Tahti Radio live as links to their homes.
 * Old `?tab=` / `?radio=` values redirect here or to Schedule / Go live. */
export const CHANNEL_RADIO_TABS = ['stream', 'pinned', 'multicast'] as const;

export type ChannelRadioTab = (typeof CHANNEL_RADIO_TABS)[number];

export type ChannelSection = 'radio';

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
      to: '/studio/profile/$section';
      params: { section: 'appearance' | 'branding' };
      replace: true;
    }
  | {
      to: '/studio/schedule';
      search: { tab: 'programme' };
      replace: true;
    }
  | {
      to: '/studio/go-live';
      search: { step: 'green-room' | 'destinations' };
      replace: true;
    }
  | { to: '/studio/stats'; replace: true }
  | { to: '/admin/tahti-selects'; replace: true };

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
      to: '/studio/profile/$section',
      params: { section: 'appearance' },
      replace: true,
    };
  }
  if (tab === 'profile') {
    return {
      to: '/studio/profile/$section',
      params: { section: 'branding' },
      replace: true,
    };
  }
  if (tab === 'radio' || tab === 'stream') {
    return { to: '/studio/channel', search: {}, hash: 'radio', replace: true };
  }
  if (tab === 'announcements' || tab === 'rotation') {
    return {
      to: '/studio/schedule',
      search: { tab: 'programme' },
      replace: true,
    };
  }
  if (tab === 'green-room') {
    return {
      to: '/studio/go-live',
      search: { step: 'green-room' },
      replace: true,
    };
  }
  if (tab === 'selects') {
    return { to: '/admin/tahti-selects', replace: true };
  }
  if (isChannelRadioTab(tab)) {
    return {
      to: '/studio/channel',
      search: tab === 'stream' ? {} : { radio: tab },
      hash: 'radio',
      replace: true,
    };
  }
  if (tab === 'tahti-radio') {
    return { to: '/studio/channel', search: {}, hash: 'radio', replace: true };
  }
  return { to: '/studio/channel', search: {}, replace: true };
}

/** Legacy `?radio=` values that are no longer Channel tabs. */
export function channelRadioRedirect(
  radio: string | undefined,
): ChannelTabRedirect | null {
  if (radio === 'rotation' || radio === 'announcements') {
    return {
      to: '/studio/schedule',
      search: { tab: 'programme' },
      replace: true,
    };
  }
  if (radio === 'tahti-radio') {
    return { to: '/studio/channel', search: {}, hash: 'radio', replace: true };
  }
  return null;
}

/** In-app path of a Radio section tab, e.g. for links and redirects. */
export function channelRadioPath(tab: ChannelRadioTab = 'stream'): string {
  return tab === 'stream'
    ? '/studio/channel#radio'
    : `/studio/channel?radio=${tab}#radio`;
}
