import type { FetchMeta } from './client';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export const DEFAULT_SOCIAL_TEMPLATE =
  'New release: {release} by {artist} — {smart_link}';

export type SocialPlatformStatus = {
  connected: boolean;
  accountLabel: string | null;
  onReleasePublished: boolean;
  onChannelLive: boolean;
  postTemplate: string;
};

export type SocialAutoPostSettings = {
  mastodon: SocialPlatformStatus;
  bluesky: SocialPlatformStatus;
  twitter: SocialPlatformStatus & { configured: boolean };
  instagram: SocialPlatformStatus & { configured: boolean };
};

export type SocialAutoPostPlatform = 'mastodon' | 'bluesky';

export type SocialTriggerSettings = {
  onReleasePublished?: boolean;
  onChannelLive?: boolean;
  postTemplate?: string;
};

export type MastodonConnectInput = SocialTriggerSettings & {
  instanceUrl: string;
  accessToken?: string;
};

export type BlueskyConnectInput = SocialTriggerSettings & {
  handle: string;
  appPassword?: string;
};

function disconnected(): SocialPlatformStatus {
  return {
    connected: false,
    accountLabel: null,
    onReleasePublished: false,
    onChannelLive: false,
    postTemplate: DEFAULT_SOCIAL_TEMPLATE,
  };
}

let mockSettings: SocialAutoPostSettings = {
  mastodon: disconnected(),
  bluesky: disconnected(),
  twitter: { ...disconnected(), configured: false },
  instagram: { ...disconnected(), configured: false },
};

function cloneMock(): SocialAutoPostSettings {
  return JSON.parse(JSON.stringify(mockSettings)) as SocialAutoPostSettings;
}

type Result =
  { ok: true; data: SocialAutoPostSettings } | { ok: false; error: string };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function fetchSocialAutoPost(): Promise<{
  data: SocialAutoPostSettings | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: cloneMock(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } =
      await requestJson<SocialAutoPostSettings>('/api/me/social');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

function applyMock(
  platform: SocialAutoPostPlatform,
  accountLabel: string,
  input: SocialTriggerSettings,
): SocialAutoPostSettings {
  const current = mockSettings[platform];
  mockSettings = {
    ...mockSettings,
    [platform]: {
      connected: true,
      accountLabel,
      onReleasePublished:
        input.onReleasePublished ?? current.onReleasePublished,
      onChannelLive: input.onChannelLive ?? current.onChannelLive,
      postTemplate: input.postTemplate ?? current.postTemplate,
    },
  };
  return cloneMock();
}

export async function saveMastodon(
  input: MastodonConnectInput,
): Promise<Result> {
  if (isForceMock()) {
    if (!mockSettings.mastodon.connected && !input.accessToken) {
      return { ok: false, error: 'Access token is required' };
    }
    return {
      ok: true,
      data: applyMock('mastodon', input.instanceUrl.replace(/\/+$/, ''), input),
    };
  }
  try {
    const { data } = await requestJson<SocialAutoPostSettings>(
      '/api/me/social/mastodon',
      { method: 'PUT', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: errorMessage(err, 'Could not connect Mastodon'),
    };
  }
}

export async function saveBluesky(input: BlueskyConnectInput): Promise<Result> {
  if (isForceMock()) {
    if (!mockSettings.bluesky.connected && !input.appPassword) {
      return { ok: false, error: 'App password is required' };
    }
    return { ok: true, data: applyMock('bluesky', input.handle, input) };
  }
  try {
    const { data } = await requestJson<SocialAutoPostSettings>(
      '/api/me/social/bluesky',
      { method: 'PUT', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Could not connect Bluesky') };
  }
}

export async function disconnectSocial(
  platform: SocialAutoPostPlatform,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSettings = { ...mockSettings, [platform]: disconnected() };
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/social/${platform}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Could not disconnect') };
  }
}
