import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCollectionTextLayer,
  saveCollectionTextLayer,
} from './collection-text-layer';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const layer = {
  textLayerMode: 'COSMIC_NEON',
  textLayerText: 'Night drive',
  textLayerAlign: 'LEFT',
};

describe('collection text layer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the text layer of a collection', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(layer));
    await expect(fetchCollectionTextLayer('night-mix')).resolves.toEqual({
      ok: true,
      data: layer,
    });
    expect(String(spy.mock.calls[0]?.[0])).toBe(
      '/tahti-api/api/me/collections/night-mix/text-layer',
    );
  });

  it('saves the whole layer with PATCH', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(layer));
    await expect(saveCollectionTextLayer('night-mix', layer)).resolves.toEqual({
      ok: true,
      data: layer,
    });
    const init = spy.mock.calls[0]?.[1];
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual(layer);
  });

  it('passes the API error through', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json(
        { error: 'textLayerText is required when a text effect is enabled' },
        400,
      ),
    );
    await expect(
      saveCollectionTextLayer('night-mix', { ...layer, textLayerText: '' }),
    ).resolves.toEqual({
      ok: false,
      error: 'textLayerText is required when a text effect is enabled',
    });
  });
});
