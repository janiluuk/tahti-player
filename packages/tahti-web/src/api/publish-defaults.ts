import { isForceMock } from './mode';
import { requestJson } from './request-json';

let mockAutoPublish = true;

/** Whether a broadcast's recording is public once it lands in the library
 * (the starting value; Go Live preflight can still change it per show). */
export async function fetchAutoPublishBroadcast(): Promise<
  { ok: true; autoPublish: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, autoPublish: mockAutoPublish };
  }
  try {
    const { data } = await requestJson<{ autoPublishBroadcast: boolean }>(
      '/api/me/channel/publish-defaults',
    );
    return { ok: true, autoPublish: data.autoPublishBroadcast };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the setting',
    };
  }
}

export async function setAutoPublishBroadcast(
  autoPublish: boolean,
): Promise<{ ok: true; autoPublish: boolean } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockAutoPublish = autoPublish;
    return { ok: true, autoPublish };
  }
  try {
    const { data } = await requestJson<{ autoPublishBroadcast: boolean }>(
      '/api/me/channel/publish-defaults',
      {
        method: 'PATCH',
        body: JSON.stringify({ autoPublishBroadcast: autoPublish }),
      },
    );
    return { ok: true, autoPublish: data.autoPublishBroadcast };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the setting',
    };
  }
}
