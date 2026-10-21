import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retrySoundProcessing } from './studio-sound-processing';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));
vi.mock('./studio-request', () => ({ requestJson }));

describe('retrySoundProcessing', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    requestJson.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('posts to the retry route', async () => {
    requestJson.mockResolvedValue({ data: { id: 'a b', status: 'PENDING' } });
    expect(await retrySoundProcessing('a b')).toEqual({ ok: true });
    expect(requestJson).toHaveBeenCalledWith(
      '/api/me/sound/a%20b/retry-processing',
      { method: 'POST' },
    );
  });

  it("passes the API's refusal through", async () => {
    requestJson.mockRejectedValue(
      new Error('Only a sound that failed processing can be retried'),
    );
    expect(await retrySoundProcessing('a')).toEqual({
      ok: false,
      error: 'Only a sound that failed processing can be retried',
    });
  });
});
