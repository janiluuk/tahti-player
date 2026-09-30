import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { mockSocial, setMockSocial } from './mock';

export type SocialConnections = {
  website: string;
  instagram: string;
  bandcamp: string;
  soundcloud: string;
  youtube: string;
  discord: string;
  mixcloud: string;
  hearthisAt: string;
  twitch: string;
  kick: string;
  spotify: string;
  tiktok: string;
  twitter: string;
  facebook: string;
  showConnections: boolean;
};

const LINK_KEYS = [
  'website',
  'instagram',
  'bandcamp',
  'soundcloud',
  'youtube',
  'discord',
  'mixcloud',
  'hearthisAt',
  'twitch',
  'kick',
  'spotify',
  'tiktok',
  'twitter',
  'facebook',
] as const;

/** Social links live in the profile's `socialLinks` string map (the same
 * bag that also holds genre tags), with `showConnections` stored as the
 * string "false" when hidden. */
export function socialConnectionsFromLinks(
  links: Record<string, string> | null | undefined,
): SocialConnections {
  const source = links ?? {};
  const connections = Object.fromEntries(
    LINK_KEYS.map((key) => [key, source[key] ?? '']),
  ) as Omit<SocialConnections, 'showConnections'>;
  return {
    ...connections,
    showConnections: source.showConnections !== 'false',
  };
}

export async function fetchSocialConnections(): Promise<{
  data: SocialConnections;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockSocial },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      socialLinks?: Record<string, string> | null;
    }>('/api/me/profile');
    return {
      data: socialConnectionsFromLinks(data.socialLinks),
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockSocial }, meta: failMeta(err) };
    }
    return { data: socialConnectionsFromLinks(null), meta: apiErrorMeta(err) };
  }
}

/** Merges into the stored links (the API replaces the whole map, and other
 * keys such as genre tags must survive). */
export async function patchSocialConnections(
  patch: Partial<SocialConnections>,
): Promise<
  { ok: true; data: SocialConnections } | { ok: false; error: string }
> {
  if (isForceMock()) {
    setMockSocial({ ...mockSocial, ...patch });
    return { ok: true, data: { ...mockSocial } };
  }
  try {
    const { data: current } = await requestJson<{
      socialLinks?: Record<string, string> | null;
    }>('/api/me/profile');
    const { showConnections, ...links } = patch;
    const socialLinks: Record<string, string> = {
      ...(current.socialLinks ?? {}),
      ...Object.fromEntries(
        Object.entries(links).map(([key, value]) => [
          key,
          String(value ?? '').trim(),
        ]),
      ),
      ...(showConnections === undefined
        ? {}
        : { showConnections: String(showConnections) }),
    };
    const { data } = await requestJson<{
      socialLinks?: Record<string, string> | null;
    }>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ socialLinks }),
    });
    return { ok: true, data: socialConnectionsFromLinks(data.socialLinks) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
