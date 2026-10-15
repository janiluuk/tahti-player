import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runLibraryProcessing } from './library-processing.mjs';

const BUSY = {
  processing: [{ id: 's_2', title: 'New Mix', status: 'PROCESSING' }],
  settled: [],
};
const IDLE = { processing: [], settled: [] };

function mockSequence(...bodies: unknown[]) {
  const fetchMock = vi.fn();
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => body,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('runLibraryProcessing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists sounds still processing', async () => {
    const fetchMock = mockFetchJson(BUSY);
    const output = await runLibraryProcessing(TEST_CONFIG);
    expect(output).toContain('New Mix');
    expect(output).toContain('PROCESSING');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/sound/processing',
    );
  });

  it('says when nothing is processing', async () => {
    mockFetchJson(IDLE);
    expect(await runLibraryProcessing(TEST_CONFIG)).toBe(
      'Nothing is processing.',
    );
  });

  it('polls with --wait until the list is empty', async () => {
    const fetchMock = mockSequence(BUSY, BUSY, IDLE);
    expect(
      await runLibraryProcessing(TEST_CONFIG, { wait: true, pollMs: 0 }),
    ).toBe('Nothing is processing.');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('exits with 1 when --wait runs out of time', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => BUSY,
    });
    vi.stubGlobal('fetch', fetchMock);
    const pending = runLibraryProcessing(TEST_CONFIG, {
      wait: true,
      timeout: '10',
    });
    await vi.advanceTimersByTimeAsync(11_000);
    const result = await pending;
    vi.useRealTimers();
    expect(result).toEqual({
      output: expect.stringContaining('Still processing after 10 s.'),
      exitCode: 1,
    });
  });

  it('rejects a bad --timeout', async () => {
    await expect(
      runLibraryProcessing(TEST_CONFIG, { wait: true, timeout: '0' }),
    ).rejects.toThrow('Invalid --timeout');
  });
});
