import { getJson } from '../http';
import { isForceMock } from '../mode';

/** A row of the association's member register (GET /api/admin/members). The
 * API includes the email; screens show names and usernames only. */
export type MemberRegisterRow = {
  memberNumber: number | null;
  displayName: string;
  email: string;
  username: string;
  memberSince: string | null;
  membershipStatus: string | null;
};

export function mockMemberRegister(): MemberRegisterRow[] {
  return [
    {
      memberNumber: 1,
      displayName: 'Mart Saar',
      email: 'mart@example.com',
      username: 'mart-saar',
      memberSince: '2024-03-01T00:00:00.000Z',
      membershipStatus: 'ACTIVE',
    },
    {
      memberNumber: 12,
      displayName: 'Liis Kask',
      email: 'liis@example.com',
      username: 'liis-kask',
      memberSince: '2025-06-01T00:00:00.000Z',
      membershipStatus: 'PAST_DUE',
    },
  ];
}

export async function fetchMemberRegister(): Promise<
  { ok: true; data: MemberRegisterRow[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: mockMemberRegister() };
  }
  try {
    return {
      ok: true,
      data: await getJson<MemberRegisterRow[]>('/api/admin/members'),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the register',
    };
  }
}
