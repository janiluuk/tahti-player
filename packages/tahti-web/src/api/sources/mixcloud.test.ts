import { afterEach, describe, expect, it, vi } from 'vitest';

import * as integrations from '../integrations';
import {
  addMixcloudCloudcast,
  fetchMixcloudProfileCloudcasts,
  searchMixcloud,
} from './mixcloud';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const cloudcast = {
  url: 'https://www.mixcloud.com/selector/sunday/',
  title: 'Sunday',
  username: 'selector',
  displayName: 'Selector',
  durationSec: 3600,
  coverUrl: null,
  genre: null,
};

describe('mixcloud import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('searches and lists a profile through the import routes', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json({ tracks: [cloudcast] }));
    await expect(searchMixcloud('deep house')).resolves.toEqual({
      ok: true,
      data: [cloudcast],
    });
    await fetchMixcloudProfileCloudcasts('https://www.mixcloud.com/selector/');
    expect(spy.mock.calls.map((c) => String(c[0]))).toEqual([
      '/tahti-api/api/v1/imports/mixcloud/search?q=deep%20house',
      '/tahti-api/api/v1/imports/mixcloud/by-username?profileUrl=https%3A%2F%2Fwww.mixcloud.com%2Fselector%2F',
    ]);
  });

  it('installs the import plugin before adding a cloudcast', async () => {
    const install = vi
      .spyOn(integrations, 'installMeIntegration')
      .mockResolvedValue({ ok: true });
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(json({ soundId: 's1', collectionItemId: 'i1' }, 201));
    await expect(addMixcloudCloudcast('col-1', cloudcast.url)).resolves.toEqual(
      { ok: true, data: { soundId: 's1' } },
    );
    expect(install).toHaveBeenCalledWith('mixcloud-import', {});
    expect(String(spy.mock.calls[0]?.[0])).toBe(
      '/tahti-api/api/v1/imports/mixcloud/add',
    );
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({
      collectionId: 'col-1',
      cloudcastUrl: cloudcast.url,
    });
  });

  it('surfaces the API error', async () => {
    vi.spyOn(integrations, 'installMeIntegration').mockResolvedValue({
      ok: true,
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'Could not fetch cloudcast from Mixcloud' }, 502),
    );
    await expect(addMixcloudCloudcast('col-1', cloudcast.url)).resolves.toEqual(
      { ok: false, error: 'Could not fetch cloudcast from Mixcloud' },
    );
  });
});
