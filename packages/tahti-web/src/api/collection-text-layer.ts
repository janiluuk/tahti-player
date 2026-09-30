import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type CollectionTextLayer = {
  textLayerMode: string;
  textLayerText: string;
  textLayerAlign: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const mockLayers = new Map<string, CollectionTextLayer>();

const EMPTY: CollectionTextLayer = {
  textLayerMode: 'NONE',
  textLayerText: '',
  textLayerAlign: 'CENTER',
};

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const path = (slug: string) =>
  `/api/me/collections/${encodeURIComponent(slug)}/text-layer`;

export async function fetchCollectionTextLayer(
  slug: string,
): Promise<Result<CollectionTextLayer>> {
  if (isForceMock()) {
    return { ok: true, data: mockLayers.get(slug) ?? EMPTY };
  }
  try {
    const { data } = await requestJson<CollectionTextLayer>(path(slug));
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not load the text layer') };
  }
}

export async function saveCollectionTextLayer(
  slug: string,
  layer: CollectionTextLayer,
): Promise<Result<CollectionTextLayer>> {
  if (isForceMock()) {
    mockLayers.set(slug, layer);
    return { ok: true, data: layer };
  }
  try {
    const { data } = await requestJson<CollectionTextLayer>(path(slug), {
      method: 'PATCH',
      body: JSON.stringify(layer),
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the text layer') };
  }
}
