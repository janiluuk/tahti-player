import { isForceMock } from './mode';
import { requestJson } from './request-json';

type Result = { ok: true } | { ok: false; error: string };

async function put(
  path: string,
  body: unknown,
  fallback: string,
): Promise<Result> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(path, { method: 'PUT', body: JSON.stringify(body) });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : fallback };
  }
}

/** Order of the public Tracks tab (`Sound.trackOrder`). */
export const reorderPublicTracks = (ids: string[]) =>
  put('/api/me/sound/reorder', { ids }, 'Could not save the track order');

/** Order of the artist page's collection grid
 * (`Collection.publicProfileOrder`, by slug). */
export const reorderProfileCollections = (slugs: string[]) =>
  put(
    '/api/me/collections/reorder',
    { slugs },
    'Could not save the collection order',
  );
