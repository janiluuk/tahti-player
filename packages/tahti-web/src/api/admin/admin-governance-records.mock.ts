import type {
  GovernanceAttendanceItem,
  GovernanceDocument,
  UpsertGovernanceAttendance,
} from '../types';
import type {
  GovernanceConflictDeclaration,
  GovernanceNoticeDelivery,
} from './admin-governance-meeting-records';
import { MOCK_GOVERNANCE_DOCUMENTS } from './admin-governance.mock';

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

const ATTENDANCE: Record<string, GovernanceAttendanceItem[]> = {
  'meeting-mock-2': [
    {
      id: 'attendance-mock-1',
      memberId: 'member-mock-1',
      displayName: 'Rautatie',
      status: 'PRESENT',
      recordedAt: '2026-09-09T16:00:00.000Z',
    },
    {
      id: 'attendance-mock-2',
      memberId: 'member-mock-2',
      displayName: 'Northern Lights',
      status: 'PRESENT',
      recordedAt: '2026-09-09T16:00:00.000Z',
    },
    {
      id: 'attendance-mock-3',
      memberId: 'member-mock-3',
      displayName: 'Kaiku Collective',
      status: 'EXCUSED',
      recordedAt: '2026-09-09T16:00:00.000Z',
    },
    {
      id: 'attendance-mock-4',
      memberId: 'member-mock-4',
      displayName: 'DJ Moonlight',
      status: 'PRESENT',
      recordedAt: '2026-09-09T16:00:00.000Z',
    },
    {
      id: 'attendance-mock-5',
      memberId: 'member-mock-5',
      displayName: 'Midnight Cartography',
      status: 'PRESENT',
      recordedAt: '2026-09-09T16:00:00.000Z',
    },
  ],
};

const CONFLICTS: Record<string, GovernanceConflictDeclaration[]> = {
  'meeting-mock-2': [
    {
      id: 'conflict-mock-1',
      memberId: 'member-mock-2',
      displayName: 'Northern Lights',
      matter: 'Sign the distribution contract',
      recused: true,
      declaredAt: '2026-09-09T16:05:00.000Z',
    },
  ],
};

const NOTICE_DELIVERIES: Record<string, GovernanceNoticeDelivery[]> = {
  'meeting-mock-1': [
    {
      id: 'delivery-mock-1',
      memberId: 'member-mock-1',
      displayName: 'Rautatie',
      email: 'board@example.com',
      sentAt: '2026-10-14T09:00:00.000Z',
      bouncedAt: null,
    },
    {
      id: 'delivery-mock-2',
      memberId: 'member-mock-3',
      displayName: 'Kaiku Collective',
      email: 'kaiku@example.com',
      sentAt: '2026-10-14T09:00:00.000Z',
      bouncedAt: '2026-10-14T09:02:00.000Z',
    },
  ],
};

export function mockGovernanceAttendance(meetingId: string) {
  return { data: [...(ATTENDANCE[meetingId] ?? [])], meta: MOCK_META };
}

export function mockUpsertGovernanceAttendance(
  meetingId: string,
  input: UpsertGovernanceAttendance,
) {
  const list = (ATTENDANCE[meetingId] ??= []);
  const existing = input.memberId
    ? list.find((item) => item.memberId === input.memberId)
    : undefined;
  const item: GovernanceAttendanceItem = {
    id: existing?.id ?? `attendance-mock-${meetingId}-${list.length + 1}`,
    memberId: input.memberId ?? null,
    displayName: input.displayName,
    status: input.status,
    recordedAt: new Date().toISOString(),
  };
  if (existing) {
    list[list.indexOf(existing)] = item;
  } else {
    list.push(item);
  }
  return { data: item, meta: MOCK_META };
}

export function mockGovernanceConflicts(meetingId: string) {
  return { ok: true as const, data: [...(CONFLICTS[meetingId] ?? [])] };
}

export function mockDeclareGovernanceConflict(
  meetingId: string,
  input: { displayName: string; matter: string; recused: boolean },
) {
  const list = (CONFLICTS[meetingId] ??= []);
  const declaration: GovernanceConflictDeclaration = {
    id: `conflict-mock-${meetingId}-${list.length + 1}`,
    memberId: null,
    declaredAt: new Date().toISOString(),
    ...input,
  };
  list.push(declaration);
  return { ok: true as const, data: declaration };
}

export function mockRemoveGovernanceConflict(id: string) {
  for (const list of Object.values(CONFLICTS)) {
    const index = list.findIndex((record) => record.id === id);
    if (index >= 0) {
      list.splice(index, 1);
      return { ok: true as const };
    }
  }
  return { ok: false as const, error: 'Conflict declaration not found' };
}

export function mockGovernanceNoticeDeliveries(meetingId: string) {
  return { ok: true as const, data: [...(NOTICE_DELIVERIES[meetingId] ?? [])] };
}

export function mockCreateGovernanceDocument(
  input: Pick<GovernanceDocument, 'title' | 'type'> &
    Partial<Omit<GovernanceDocument, 'id'>>,
) {
  const now = new Date().toISOString();
  const document: GovernanceDocument = {
    id: `document-mock-${MOCK_GOVERNANCE_DOCUMENTS.length + 1}`,
    description: null,
    version: 1,
    effectiveAt: null,
    publishedAt: null,
    meetingId: null,
    downloadUrl: null,
    externalUrl: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  MOCK_GOVERNANCE_DOCUMENTS.unshift(document);
  return { data: document, meta: MOCK_META };
}
