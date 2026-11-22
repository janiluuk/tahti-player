export type LinkPagePlayMode = 'inline' | 'open';

export type LinkPageOwnLink = {
  id: string;
  label: string;
  url: string;
};

export type LinkPageConfig = {
  ownLinks: LinkPageOwnLink[];
  soundIds: string[];
  setIds: string[];
  playMode: LinkPagePlayMode;
};

export type PublicLinkPageLink = {
  key: string;
  label: string;
  url: string;
  source: 'profile' | 'own';
  id?: string;
};

export type PublicLinkPageSound = {
  id: string;
  title: string;
  coverUrl: string | null;
  durationSec: number | null;
  playUrl?: string | null;
  badge?: 'live' | 'replay' | null;
};

export type PublicLinkPageSet = {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  itemCount: number;
  url: string;
};

export type PublicLinkPage = {
  playMode: LinkPagePlayMode;
  links: PublicLinkPageLink[];
  sounds: PublicLinkPageSound[];
  sets: PublicLinkPageSet[];
  siteUrl: string;
  linkPageUrl: string;
};

export const EMPTY_LINK_PAGE_CONFIG: LinkPageConfig = {
  ownLinks: [],
  soundIds: [],
  setIds: [],
  playMode: 'inline',
};

export function parseLinkPageConfig(raw: unknown): LinkPageConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_LINK_PAGE_CONFIG };
  }
  const o = raw as Record<string, unknown>;
  const ownLinks = Array.isArray(o.ownLinks)
    ? o.ownLinks.filter((link): link is LinkPageOwnLink =>
        Boolean(
          link &&
          typeof link === 'object' &&
          typeof (link as LinkPageOwnLink).id === 'string' &&
          typeof (link as LinkPageOwnLink).label === 'string' &&
          typeof (link as LinkPageOwnLink).url === 'string',
        ),
      )
    : [];
  const soundIds = Array.isArray(o.soundIds)
    ? o.soundIds.filter((id): id is string => typeof id === 'string')
    : [];
  const setIds = Array.isArray(o.setIds)
    ? o.setIds.filter((id): id is string => typeof id === 'string')
    : [];
  const playMode = o.playMode === 'open' ? 'open' : 'inline';
  return { ownLinks, soundIds, setIds, playMode };
}
