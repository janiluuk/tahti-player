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
    const { data } = await requestJson<SocialConnections>(
      '/api/me/connections',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockSocial }, meta: failMeta(err) };
    }
    return {
      data: {
        website: '',
        instagram: '',
        bandcamp: '',
        soundcloud: '',
        youtube: '',
        discord: '',
        mixcloud: '',
        hearthisAt: '',
        twitch: '',
        kick: '',
        spotify: '',
        tiktok: '',
        twitter: '',
        facebook: '',
        showConnections: true,
      },
      meta: apiErrorMeta(err),
    };
  }
}

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
    const { data } = await requestJson<SocialConnections>(
      '/api/me/connections',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
