import { afterEach, describe, expect, it, vi } from 'vitest';

import { setRecordLegalHold } from './admin-governance-holds';

function ok() {
  return new Response('{}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('setRecordLegalHold', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('puts a hold on each kind of record at its own path', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal('fetch', fetchMock);
    await setRecordLegalHold('meeting', 'm1', ' Dispute ');
    await setRecordLegalHold('document', 'd1', 'Dispute');
    await setRecordLegalHold('resolution', '42', 'Dispute');
    const calls = fetchMock.mock.calls.map(([url, init]) => [
      String(url),
      init.method,
      JSON.parse(init.body),
    ]);
    expect(calls[0]![0]).toContain(
      '/api/admin/governance/meetings/m1/legal-hold',
    );
    expect(calls[0]![1]).toBe('PUT');
    expect(calls[0]![2]).toEqual({ reason: 'Dispute' });
    expect(calls[1]![0]).toContain(
      '/api/admin/governance/documents/d1/legal-hold',
    );
    expect(calls[2]![0]).toContain('/api/admin/resolutions/42/legal-hold');
  });

  it('releases with DELETE and needs a reason to hold', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal('fetch', fetchMock);
    await setRecordLegalHold('meeting', 'm1', null);
    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE');
    await expect(setRecordLegalHold('meeting', 'm1', ' ')).resolves.toEqual({
      ok: false,
      error: 'Give the reason for the hold',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
