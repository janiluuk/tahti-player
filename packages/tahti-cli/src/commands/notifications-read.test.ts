import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { runNotificationsRead } from './notifications-read.mjs';

function mockNoContent(status = 204, body: unknown = null) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('runNotificationsRead', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks one notification read with PATCH', async () => {
    const fetchMock = mockNoContent();
    expect(await runNotificationsRead(TEST_CONFIG, 'n_1')).toBe(
      'Marked n_1 read.',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/notifications/n_1/read',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer tahti_test',
        }),
      }),
    );
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body');
  });

  it('marks everything read with --all', async () => {
    const fetchMock = mockNoContent();
    expect(
      await runNotificationsRead(TEST_CONFIG, undefined, { all: true }),
    ).toContain('sticky notices stay');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/notifications/read-all',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('needs an id or --all, not both', async () => {
    await expect(runNotificationsRead(TEST_CONFIG, undefined)).rejects.toThrow(
      'Missing notification id',
    );
    await expect(
      runNotificationsRead(TEST_CONFIG, 'n_1', { all: true }),
    ).rejects.toThrow('not both');
  });

  it('shows the API message for an unknown id', async () => {
    mockNoContent(404, { error: 'Notification not found' });
    await expect(runNotificationsRead(TEST_CONFIG, 'nope')).rejects.toThrow(
      'Notification not found',
    );
  });

  it('explains a read-only token', async () => {
    mockNoContent(403, { error: 'Token lacks write scope' });
    await expect(runNotificationsRead(TEST_CONFIG, 'n_1')).rejects.toThrow(
      'Token invalid or missing scope',
    );
  });
});
