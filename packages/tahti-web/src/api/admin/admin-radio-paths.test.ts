import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  radioMoveToFront,
  radioOptOut,
  radioRemoveOptOut,
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
});
