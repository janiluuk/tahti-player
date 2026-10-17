import { afterEach, describe, expect, it, vi } from 'vitest';

import { linkMotionMeeting } from './governance-motion-meeting';

describe('linkMotionMeeting', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('puts the meeting id, or null to unlink', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await linkMotionMeeting('m 1', null);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/motions/m%201/meeting');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ meetingId: null });
  });
});
