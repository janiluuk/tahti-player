import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatAmount, runPurchases } from './purchases.mjs';

const PURCHASES = [
  {
    id: 'p_1',
    tierName: 'Lossless album',
    amountCents: 1200,
    createdAt: '2026-10-02T12:00:00.000Z',
    artist: { username: 'aurora', displayName: 'aurora@example.com' },
    tracks: [
      { id: 's_1', title: 'Night Drive' },
      { id: 's_2', title: 'Dawn' },
    ],
  },
];

describe('runPurchases', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists purchases without showing an email as the artist', async () => {
    const fetchMock = mockFetchJson(PURCHASES);
    const output = await runPurchases(TEST_CONFIG);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/purchases',
    );
    expect(output).toContain('2026-10-02');
    expect(output).toContain('aurora');
    expect(output).not.toContain('@example.com');
    expect(output).toContain('12.00');
    expect(output).toContain('Night Drive, Dawn');
  });

  it('says when there are none', async () => {
    mockFetchJson([]);
    expect(await runPurchases(TEST_CONFIG)).toBe('No purchases yet.');
  });

  it('prints the API response with --json', async () => {
    mockFetchJson(PURCHASES);
    expect(JSON.parse(await runPurchases(TEST_CONFIG, { json: true }))).toEqual(
      PURCHASES,
    );
  });

  it('formats cents', () => {
    expect(formatAmount(5)).toBe('0.05');
    expect(formatAmount(undefined)).toBeNull();
  });
});
