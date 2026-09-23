import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchStudioCollection,
  patchStudioCollection,
} from './studio-collections';
import { fetchSoundProcessingStatus } from './studio-sounds';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));
vi.mock('./studio-request', () => ({ requestJson }));

const collection = {
  slug: 'late-night',
  name: 'Late night',
  isPublic: false,
  visibility: 'DRAFT',
  items: [],
};

describe('collection API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    requestJson.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reads the API's DRAFT visibility as the editor's Private", async () => {
    requestJson.mockResolvedValue({ data: collection });
    const { data } = await fetchStudioCollection('late-night');
    expect(data.visibility).toBe('PRIVATE');
  });

  it('saves details, visibility and gallery in one request, Private as DRAFT', async () => {
    requestJson.mockResolvedValue({ data: collection });
    const result = await patchStudioCollection('late-night', {
      name: 'Late night',
      visibility: 'PRIVATE',
      gallery: { slideshowImages: ['https://cdn/a.jpg'], galleryMode: 'NONE' },
    });
    expect(requestJson).toHaveBeenCalledTimes(1);
    const [url, init] = requestJson.mock.calls[0]!;
    expect(url).toBe('/api/me/collections/late-night');
    expect(JSON.parse(init.body)).toMatchObject({
      visibility: 'DRAFT',
      gallery: { slideshowImages: ['https://cdn/a.jpg'], galleryMode: 'NONE' },
    });
    expect(result.ok && result.data.visibility).toBe('PRIVATE');
  });
});

describe('fetchSoundProcessingStatus', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    requestJson.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('asks only for processing items and the watched ids', async () => {
    requestJson.mockResolvedValue({
      data: { processing: [], settled: [{ id: 'a', status: 'READY' }] },
    });
    const { data } = await fetchSoundProcessingStatus(['a', 'b c']);
    expect(requestJson).toHaveBeenCalledWith(
      '/api/me/sound/processing?ids=a,b%20c',
    );
    expect(data.settled).toEqual([{ id: 'a', status: 'READY' }]);
  });

  it('sends no query when nothing is watched and survives errors', async () => {
    requestJson.mockRejectedValue(new Error('offline'));
    const { data } = await fetchSoundProcessingStatus([]);
    expect(requestJson).toHaveBeenCalledWith('/api/me/sound/processing');
    expect(data).toEqual({ processing: [], settled: [] });
  });
});
