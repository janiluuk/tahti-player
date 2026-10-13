import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAdminAnnualReports,
  fetchAdminGovernanceDocuments,
  fetchAdminGovernanceMeetings,
  fetchAdminResolutions,
} from './admin-governance';

vi.mock('../mode', async (original) => ({
  ...(await original<typeof import('../mode')>()),
  isForceMock: () => true,
}));

describe('governance records in the mock app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists meetings, documents, resolutions and reports without the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const results = await Promise.all([
      fetchAdminGovernanceMeetings(),
      fetchAdminGovernanceDocuments(),
      fetchAdminResolutions(),
      fetchAdminAnnualReports(),
    ]);
    for (const result of results) {
      expect(result.meta.source).toBe('mock');
      expect(result.data.length).toBeGreaterThan(0);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps unpublished resolutions out of the published list', async () => {
    const all = await fetchAdminResolutions();
    const published = await fetchAdminResolutions(true);
    expect(published.data.length).toBeLessThan(all.data.length);
    expect(published.data.every((resolution) => resolution.publishedAt)).toBe(
      true,
    );
  });
});
