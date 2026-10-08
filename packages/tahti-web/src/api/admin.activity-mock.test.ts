import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAdminActivity, fetchAdminGovernanceActivity } from './admin';

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('mock admin activity', () => {
  it('returns only the asked action', async () => {
    const all = await fetchAdminActivity({ limit: 100 });
    const votes = await fetchAdminActivity({ action: 'VOTE_CAST', limit: 100 });

    expect(votes.data.length).toBeGreaterThan(0);
    expect(votes.data.length).toBeLessThan(all.data.length);
    expect(votes.data.every((row) => row.action === 'VOTE_CAST')).toBe(true);
    expect(votes.total).toBe(votes.data.length);
  });

  it('returns only the asked actor', async () => {
    const rows = await fetchAdminActivity({ actorId: 'u-4', limit: 100 });

    expect(rows.data.length).toBeGreaterThan(0);
    expect(rows.data.every((row) => row.actorId === 'u-4')).toBe(true);
  });

  it('lists each governance entry once', async () => {
    const { data } = await fetchAdminGovernanceActivity();

    expect(new Set(data.map((row) => row.id)).size).toBe(data.length);
  });
});
