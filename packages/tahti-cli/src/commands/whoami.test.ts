import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatCurrentUser, runWhoami, safeDisplayName } from './whoami.mjs';

const USER = {
  id: 'u1',
  email: 'artist@example.test',
  username: 'artist',
  displayName: 'The Artist',
  avatarUrl: null,
  tier: 'FREE',
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
  isMember: true,
  isBoard: false,
  membership: { status: 'ACTIVE', activatedAt: '2026-01-02T00:00:00.000Z' },
  channel: {
    slug: 'the-artist',
    state: 'OFFLINE',
    goneLiveAt: null,
    nextBroadcastAt: null,
    customDomain: null,
    customDomainVerified: false,
  },
  storage: { usedBytes: '1048576', showSoftTarget: false },
};

describe('safeDisplayName', () => {
  it('uses the display name when present', () => {
    expect(safeDisplayName(USER)).toBe('The Artist');
  });

  it('falls back to the username, never an email', () => {
    expect(safeDisplayName({ ...USER, displayName: '' })).toBe('artist');
    expect(
      safeDisplayName({ ...USER, displayName: 'artist@example.test' }),
    ).toBe('artist');
  });
});

describe('formatCurrentUser', () => {
  it('shows username and display name but never the email', () => {
    const output = formatCurrentUser(USER);
    expect(output).toContain('USERNAME      artist');
    expect(output).toContain('DISPLAY NAME  The Artist');
    expect(output).toContain('CHANNEL       the-artist');
    expect(output).toContain('STORAGE USED  1.0 MB');
    expect(output).not.toContain('@');
  });

  it('handles an account without a channel', () => {
    expect(formatCurrentUser({ ...USER, channel: null })).toContain(
      'CHANNEL       -',
    );
  });
});

describe('runWhoami', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/auth/me with the bearer token', async () => {
    const fetchMock = mockFetchJson(USER);
    await runWhoami(TEST_CONFIG);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tahti_test',
        }),
      }),
    );
  });

  it('prints the API response unchanged with --json', async () => {
    mockFetchJson(USER);
    const output = await runWhoami(TEST_CONFIG, { json: true });
    expect(JSON.parse(output)).toEqual(USER);
  });

  it('reports an invalid token on 401', async () => {
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);
    await expect(runWhoami(TEST_CONFIG)).rejects.toThrow(
      /Token invalid or missing scope/,
    );
  });
});
