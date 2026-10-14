import { getJson, sendJson } from '../http';
import { isForceMock } from '../mode';
import {
  mockDeclareGovernanceConflict,
  mockGovernanceConflicts,
  mockGovernanceNoticeDeliveries,
} from './admin-governance-records.mock';

export type GovernanceConflictDeclaration = {
  id: string;
  memberId: string | null;
  displayName: string;
  matter: string;
  recused: boolean;
  declaredAt: string;
};

export type GovernanceNoticeDelivery = {
  id: string;
  memberId: string;
  displayName: string | null;
  email: string;
  sentAt: string;
  bouncedAt: string | null;
};

export async function fetchAdminGovernanceConflicts(
  meetingId: string,
): Promise<
  | { ok: true; data: GovernanceConflictDeclaration[] }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return mockGovernanceConflicts(meetingId);
  }
  try {
    const data = await getJson<GovernanceConflictDeclaration[]>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/conflicts`,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load declarations',
    };
  }
}

export async function declareAdminGovernanceConflict(
  meetingId: string,
  input: { displayName: string; matter: string; recused: boolean },
): Promise<
  | { ok: true; data: GovernanceConflictDeclaration }
  | { ok: false; error: string }
> {
  const displayName = input.displayName.trim();
  const matter = input.matter.trim();
  if (!displayName || !matter) {
    return { ok: false, error: 'Give the name and the matter.' };
  }
  if (isForceMock()) {
    return mockDeclareGovernanceConflict(meetingId, {
      displayName,
      matter,
      recused: input.recused,
    });
  }
  try {
    const data = await sendJson<GovernanceConflictDeclaration>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/conflicts`,
      'POST',
      { displayName, matter, recused: input.recused },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not record it',
    };
  }
}

export async function fetchAdminGovernanceNoticeDeliveries(
  meetingId: string,
): Promise<
  { ok: true; data: GovernanceNoticeDelivery[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return mockGovernanceNoticeDeliveries(meetingId);
  }
  try {
    const data = await getJson<GovernanceNoticeDelivery[]>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/notice-deliveries`,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load deliveries',
    };
  }
}
