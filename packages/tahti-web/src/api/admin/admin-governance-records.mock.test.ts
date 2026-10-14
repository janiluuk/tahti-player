import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAdminGovernanceDocument,
  fetchAdminGovernanceAttendance,
  fetchAdminGovernanceDocuments,
  upsertAdminGovernanceAttendance,
} from './admin-governance';
import {
  declareAdminGovernanceConflict,
  fetchAdminGovernanceConflicts,
  fetchAdminGovernanceNoticeDeliveries,
} from './admin-governance-meeting-records';

vi.mock('../mode', async (original) => ({
  ...(await original<typeof import('../mode')>()),
  isForceMock: () => true,
}));

describe('governance meeting records in the mock app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records attendance, updating a member who is already on the list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const before = await fetchAdminGovernanceAttendance('meeting-mock-2');
    expect(before.data).toHaveLength(5);

    await upsertAdminGovernanceAttendance('meeting-mock-2', {
      memberId: 'member-mock-3',
      displayName: 'Kaiku Collective',
      status: 'PRESENT',
    });
    const added = await upsertAdminGovernanceAttendance('meeting-mock-2', {
      displayName: 'Guest speaker',
      status: 'PRESENT',
    });
    expect(added.meta.source).toBe('mock');

    const after = await fetchAdminGovernanceAttendance('meeting-mock-2');
    expect(after.data).toHaveLength(6);
    expect(
      after.data.find((item) => item.memberId === 'member-mock-3')?.status,
    ).toBe('PRESENT');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('declares conflicts and lists notice deliveries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const declared = await declareAdminGovernanceConflict('meeting-mock-1', {
      displayName: 'Rautatie',
      matter: 'Venue booking',
      recused: false,
    });
    expect(declared.ok).toBe(true);

    const conflicts = await fetchAdminGovernanceConflicts('meeting-mock-1');
    expect(conflicts.ok && conflicts.data.map((c) => c.matter)).toEqual([
      'Venue booking',
    ]);
    const deliveries =
      await fetchAdminGovernanceNoticeDeliveries('meeting-mock-1');
    expect(deliveries.ok && deliveries.data).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('adds a new document to the list', async () => {
    const created = await createAdminGovernanceDocument({
      title: 'Privacy policy',
      type: 'POLICY',
    });
    expect(created.data?.title).toBe('Privacy policy');
    const documents = await fetchAdminGovernanceDocuments();
    expect(documents.data[0]?.title).toBe('Privacy policy');
  });
});
