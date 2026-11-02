import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addTrackToCollaborativePlaylist,
  removeOwnCollaborativeAdd,
} from './catalog-search';

const { sendJson } = vi.hoisted(() => ({ sendJson: vi.fn() }));
vi.mock('./http', () => ({ sendJson, getJson: vi.fn() }));

describe('collaborative playlist adds', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    sendJson.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('returns the new item id so the add can be undone', async () => {
    sendJson.mockResolvedValue({ id: 'item-3' });
    expect(
      await addTrackToCollaborativePlaylist('mix', 's1', '  why  '),
    ).toEqual({
      ok: true,
      itemId: 'item-3',
    });
    expect(sendJson).toHaveBeenCalledWith(
      '/api/v1/collections/mix/items',
      'POST',
      {
        soundId: 's1',
        note: 'why',
      },
    );
  });

  it('reports the API error', async () => {
    sendJson.mockRejectedValue(new Error('Already in this playlist'));
    expect(await addTrackToCollaborativePlaylist('mix', 's1')).toEqual({
      ok: false,
      error: 'Already in this playlist',
    });
  });

  it('takes back your own add', async () => {
    sendJson.mockResolvedValue(null);
    expect(await removeOwnCollaborativeAdd('mix', 'item-3')).toEqual({
      ok: true,
    });
    expect(sendJson).toHaveBeenCalledWith(
      '/api/v1/collections/mix/items/item-3',
      'DELETE',
    );
  });
});
