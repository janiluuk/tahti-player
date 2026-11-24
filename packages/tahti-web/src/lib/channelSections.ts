/** Studio → Channel → Radio is the 24/7 stream (Stream · Pinned).
 * Programme, stats, green room, live destinations and Tahti Radio live as
 * links to their homes. Old `/studio/channel?tab=` / `?radio=` / `#radio`
 * addresses redirect to a Channel tab or to Schedule / Go live. */
export const CHANNEL_RADIO_TABS = ['stream', 'pinned'] as const;

export type ChannelRadioTab = (typeof CHANNEL_RADIO_TABS)[number];

export const isChannelRadioTab = (value: unknown): value is ChannelRadioTab =>
  (CHANNEL_RADIO_TABS as readonly unknown[]).includes(value);

export type ChannelTabRedirect =
  | {
      to: '/studio/channel/$section';
      params: { section: 'design' | 'radio' };
      search: { tab?: ChannelRadioTab };
      replace: true;
    }
  | {
      to: '/studio/profile/$section';
      params: { section: 'branding' };
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
  | { to: '/admin/tahti-selects'; replace: true };

const radioRedirect = (tab?: ChannelRadioTab): ChannelTabRedirect => ({
  to: '/studio/channel/$section',
  params: { section: 'radio' },
  search: tab && tab !== 'stream' ? { tab } : {},
  replace: true,
});

const designRedirect: ChannelTabRedirect = {
  to: '/studio/channel/$section',
  params: { section: 'design' },
  search: {},
  replace: true,
};

/** Where an old `/studio/channel?tab=…` link goes now. */
function channelTabRedirect(tab: string): ChannelTabRedirect {
  if (tab === 'design') {
    return designRedirect;
  }
  if (tab === 'profile') {
    return {
      to: '/studio/profile/$section',
      params: { section: 'branding' },
      replace: true,
    };
  }
  if (tab === 'announcements' || tab === 'rotation') {
    return {
      to: '/studio/schedule',
      search: { tab: 'programme' },
      replace: true,
    };
  }
  if (tab === 'green-room' || tab === 'multicast') {
    return {
      to: '/studio/go-live',
      search: { step: tab === 'multicast' ? 'destinations' : 'green-room' },
      replace: true,
    };
  }
  if (tab === 'selects') {
    return { to: '/admin/tahti-selects', replace: true };
  }
  if (isChannelRadioTab(tab)) {
    return radioRedirect(tab);
  }
  if (tab === 'radio' || tab === 'tahti-radio') {
    return radioRedirect();
  }
  return designRedirect;
}

/** Where a bare `/studio/channel` address goes, keeping old `?tab=`,
 * `?radio=` and `#radio` / `#green-room` links working. */
export function channelLandingRedirect({
  tab,
  radio,
  hash,
}: {
  tab?: string;
  radio?: string;
  hash?: string;
}): ChannelTabRedirect {
  if (tab) {
    return channelTabRedirect(tab);
  }
  if (
    radio === 'rotation' ||
    radio === 'announcements' ||
    radio === 'multicast'
  ) {
    return channelTabRedirect(radio);
  }
  if (radio) {
    return radioRedirect(isChannelRadioTab(radio) ? radio : undefined);
  }
  if (hash === 'radio') {
    return radioRedirect();
  }
  if (hash === 'green-room') {
    return channelTabRedirect('green-room');
  }
  return designRedirect;
}

/** In-app path of a Radio tab, e.g. for links and redirects. */
export function channelRadioPath(tab: ChannelRadioTab = 'stream'): string {
  return tab === 'stream'
    ? '/studio/channel/radio'
    : `/studio/channel/radio?tab=${tab}`;
}
