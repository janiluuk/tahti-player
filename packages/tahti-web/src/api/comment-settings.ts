import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type CommentSettings = {
  channelCommentsEnabled: boolean | null;
  newUploadCommentsEnabled: boolean;
  newChannelCommentsEnabled: boolean;
};

type CommentDefaults = {
  defaultTrackCommentsEnabled: boolean;
  defaultChannelCommentsEnabled: boolean;
};

let mockSettings: CommentSettings = {
  channelCommentsEnabled: true,
  newUploadCommentsEnabled: true,
  newChannelCommentsEnabled: true,
};

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/** Channel comments on/off plus the comments defaults for new uploads and
 * for the channel once it is created. `channelCommentsEnabled` is null when
 * the user has no channel yet. */
export async function fetchCommentSettings(): Promise<
  { ok: true; data: CommentSettings } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: mockSettings };
  }
  try {
    const [defaults, channel] = await Promise.all([
      requestJson<CommentDefaults>('/api/me/comments/defaults'),
      requestJson<{ commentsEnabled: boolean }>('/api/me/comments/channel')
        .then(({ data }) => data.commentsEnabled)
        .catch(() => null),
    ]);
    return {
      ok: true,
      data: {
        channelCommentsEnabled: channel,
        newUploadCommentsEnabled: defaults.data.defaultTrackCommentsEnabled,
        newChannelCommentsEnabled: defaults.data.defaultChannelCommentsEnabled,
      },
    };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not load the setting') };
  }
}

export async function setChannelCommentsEnabled(
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSettings = { ...mockSettings, channelCommentsEnabled: enabled };
    return { ok: true, enabled };
  }
  try {
    const { data } = await requestJson<{ commentsEnabled: boolean }>(
      '/api/me/comments/channel',
      { method: 'PATCH', body: JSON.stringify({ commentsEnabled: enabled }) },
    );
    return { ok: true, enabled: data.commentsEnabled };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the setting') };
  }
}

async function patchCommentDefault(
  field: keyof CommentDefaults,
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  try {
    const { data } = await requestJson<CommentDefaults>(
      '/api/me/comments/defaults',
      { method: 'PATCH', body: JSON.stringify({ [field]: enabled }) },
    );
    return { ok: true, enabled: data[field] };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the setting') };
  }
}

export async function setNewUploadCommentsEnabled(
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSettings = { ...mockSettings, newUploadCommentsEnabled: enabled };
    return { ok: true, enabled };
  }
  return patchCommentDefault('defaultTrackCommentsEnabled', enabled);
}

/** The comments setting a channel starts with when it is created. */
export async function setNewChannelCommentsEnabled(
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSettings = { ...mockSettings, newChannelCommentsEnabled: enabled };
    return { ok: true, enabled };
  }
  return patchCommentDefault('defaultChannelCommentsEnabled', enabled);
}
