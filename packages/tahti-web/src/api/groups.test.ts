import { beforeEach, describe, expect, it } from 'vitest';

import {
  mockCreateGroup,
  mockFetchMyGroups,
  mockFetchPublicGroup,
  mockGroupMembership,
  mockSubmitGroupSound,
} from './groups-mock';
import { resetMockOverrides } from './mock-overrides';

describe('groups mock store', () => {
  beforeEach(() => {
    resetMockOverrides();
  });

  it('creates a group with a collective playlist slug', () => {
    const group = mockCreateGroup({ name: 'Peak Time Crew' });
    expect(group.slug).toBe('peak-time-crew');
    expect(group.collectionSlug).toBe('group-peak-time-crew');
    expect(group.role).toBe('OWNER');
  });

  it('marks membership after an open submit', () => {
    const group = mockCreateGroup({
      name: 'Open Floor',
      submitPolicy: 'OPEN',
    });
    const submitted = mockSubmitGroupSound(group.slug, 'sound-1');
    expect(submitted).toMatchObject({ ok: true, added: true });
    const membership = mockGroupMembership('sound-1');
    expect(membership.find((row) => row.slug === group.slug)).toMatchObject({
      member: true,
      collectionSlug: group.collectionSlug,
      itemId: `mock-gitem-${group.slug}`,
    });
  });

  it('queues APPROVE submits for plain members', () => {
    const groups = mockFetchMyGroups();
    const approve = groups.find((g) => g.submitPolicy === 'APPROVE');
    expect(approve).toBeTruthy();
    expect(mockSubmitGroupSound(approve!.slug, 'sound-2')).toEqual({
      ok: true,
      added: false,
      pending: true,
      itemId: null,
    });
  });

  it('exposes createdBy on the public group detail', () => {
    const detail = mockFetchPublicGroup('trance-mixes');
    expect(detail?.createdBy.username).toBe('demo');
    expect(detail?.collectionSlug).toBe('group-trance-mixes');
  });
});
