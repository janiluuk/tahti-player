import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAdminGovernanceMeeting,
  createAdminResolution,
  fetchAdminAnnualReports,
  fetchAdminGovernanceDocuments,
  fetchAdminGovernanceMeetings,
  fetchAdminResolutions,
  generateAdminAnnualReport,
  patchAdminGovernanceMeeting,
  patchAdminResolution,
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

  it('keeps a new meeting and a change of its state', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const created = await createAdminGovernanceMeeting({
      title: 'Extraordinary meeting',
      type: 'EXTRAORDINARY_GENERAL',
    });
    expect(created.data).toMatchObject({
      title: 'Extraordinary meeting',
      state: 'DRAFT',
    });
    const id = created.data?.id ?? '';
    const patched = await patchAdminGovernanceMeeting(id, {
      state: 'SCHEDULED',
    });
    expect(patched.data?.state).toBe('SCHEDULED');
    const listed = (await fetchAdminGovernanceMeetings()).data;
    expect(listed.find((meeting) => meeting.id === id)?.state).toBe(
      'SCHEDULED',
    );
    expect((await patchAdminGovernanceMeeting('nope', {})).data).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('records a resolution unpublished and publishes it', async () => {
    const created = await createAdminResolution({
      title: 'Open the grant round',
      body: 'Applications open on 1 November.',
      votedAt: '2026-10-14T16:00:00.000Z',
      outcome: 'PASSED',
      voteFor: 5,
      voteAgainst: 0,
      voteAbstain: 0,
    });
    const id = created.data?.id ?? '';
    const published = () =>
      fetchAdminResolutions(true).then((result) =>
        result.data.some((resolution) => resolution.id === id),
      );
    await expect(published()).resolves.toBe(false);
    await patchAdminResolution(id, {
      publishedAt: '2026-10-14T17:00:00.000Z',
    });
    await expect(published()).resolves.toBe(true);
  });

  it('generates one report per year', async () => {
    const before = (await fetchAdminAnnualReports()).data.length;
    await generateAdminAnnualReport(2024);
    await generateAdminAnnualReport(2024);
    const after = (await fetchAdminAnnualReports()).data;
    expect(after.length).toBe(before + 1);
    expect(after[0].year).toBe(2024);
  });
});
