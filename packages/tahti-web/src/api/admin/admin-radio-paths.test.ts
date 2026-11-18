import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addToRadioRotation,
  fetchAdminRadioRotation,
  radioMoveToFront,
  radioOptOut,
  radioRemoveOptOut,
  removeFromRadioRotation,
  reorderRadioRotation,
  searchAdminRadioBrowse,
} from './admin-radio';

function stubFetch() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('{}', { status: 200 }));
}

describe('admin radio rotation paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opts a channel out through /opt-out/:channelId', async () => {
    const fetchSpy = stubFetch();
    await expect(radioOptOut('ch 1')).resolves.toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/admin\/radio\/opt-out\/ch%201$/);
    expect(init?.method).toBe('POST');
  });

  it('removes the opt-out with DELETE on the same path', async () => {
    const fetchSpy = stubFetch();
    await radioRemoveOptOut('ch1');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/admin\/radio\/opt-out\/ch1$/);
    expect(init?.method).toBe('DELETE');
  });

  it('moves a channel to the front through /reset-rotation/:channelId', async () => {
    const fetchSpy = stubFetch();
    await radioMoveToFront('ch1');
    expect(String(fetchSpy.mock.calls[0]![0])).toMatch(
      /\/api\/admin\/radio\/reset-rotation\/ch1$/,
    );
  });

  it('loads the curated playlist from /api/admin/tahti-radio', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [] }), { status: 200 }),
      );
    await fetchAdminRadioRotation();
    expect(String(fetchSpy.mock.calls[0]![0])).toMatch(
      /\/api\/admin\/tahti-radio$/,
    );
  });

  it('browses, adds, reorders and removes through /api/admin/tahti-radio', async () => {
    const fetchSpy = stubFetch();
    await searchAdminRadioBrowse('night');
    expect(String(fetchSpy.mock.calls[0]![0])).toMatch(
      /\/api\/admin\/tahti-radio\/browse\?q=night$/,
    );

    await addToRadioRotation({
      id: 'sound-1',
      title: 'Night',
      durationSec: 120,
      license: 'CC_BY',
      artistName: 'Aino',
      channelSlug: 'aino',
    });
    expect(String(fetchSpy.mock.calls[1]![0])).toMatch(
      /\/api\/admin\/tahti-radio\/items$/,
    );
    expect(fetchSpy.mock.calls[1]![1]?.method).toBe('POST');

    await reorderRadioRotation(['a', 'b']);
    expect(String(fetchSpy.mock.calls[2]![0])).toMatch(
      /\/api\/admin\/tahti-radio\/reorder$/,
    );
    expect(fetchSpy.mock.calls[2]![1]?.method).toBe('PUT');

    await removeFromRadioRotation('item 1');
    expect(String(fetchSpy.mock.calls[3]![0])).toMatch(
      /\/api\/admin\/tahti-radio\/items\/item%201$/,
    );
    expect(fetchSpy.mock.calls[3]![1]?.method).toBe('DELETE');
  });
});
