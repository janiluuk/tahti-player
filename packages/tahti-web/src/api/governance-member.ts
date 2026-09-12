import { requestJson } from './client-request';
import {
  mockGovernanceDocuments,
  mockGovernanceMeetings,
  mockGovernanceMembers,
  mockGovernanceQuarterlyReports,
} from './governanceMocks';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import type {
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceMember,
  GovernanceMotion,
  GovernanceMotionDetail,
  GovernanceMotionDraft,
  GovernanceQuarterlyReport,
  PublicGovernanceMotion,
} from './types';

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export type MotionComment = {
  id: string;
  body: string;
  authorId?: string;
  authorDisplayName?: string | null;
  createdAt: string;
};

let mockMotions: GovernanceMotion[] = [
  {
    id: 'motion-5',
    title: 'Adopt a code of conduct for chat moderation',
    state: 'DRAFT',
    proposer: 'Demo Member',
    openAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalVotes: 0,
    youVoted: false,
    commentCount: 1,
  },
  {
    id: 'motion-1',
    title: 'Approve 2026 grant formula',
    state: 'OPEN',
    proposer: 'Board',
    totalVotes: 3,
    youVoted: false,
    commentCount: 2,
    tally: { YES: 1, NO: 1, ABSTAIN: 1 },
  },
  {
    id: 'motion-3',
    title: 'Keep overnight radio hours uncapped',
    state: 'OPEN',
    proposer: 'Demo Member',
    totalVotes: 4,
    youVoted: false,
    commentCount: 1,
    tally: { YES: 1, NO: 2, ABSTAIN: 1 },
  },
  {
    id: 'motion-2',
    title: 'Confirm annual report',
    state: 'CLOSED',
    proposer: 'Board',
    totalVotes: 12,
    youVoted: true,
    yourChoice: 'YES',
    tally: { YES: 10, NO: 1, ABSTAIN: 1 },
    commentCount: 0,
  },
  {
    id: 'motion-4',
    title: 'Require overnight radio blackout',
    state: 'CLOSED',
    proposer: 'Board',
    totalVotes: 13,
    youVoted: true,
    yourChoice: 'YES',
    tally: { YES: 3, NO: 9, ABSTAIN: 1 },
    commentCount: 2,
  },
];

const mockMotionDescriptions: Record<string, string> = {
  'motion-5':
    'Adopts a written code of conduct governing chat moderation across all channels, including an escalation ladder before a member can be banned.',
  'motion-1':
    'Approves the 2026 grant funding formula, weighting overnight and daytime programming slots evenly per the finance committee proposal.',
  'motion-3':
    'Keeps overnight radio broadcast hours uncapped rather than introducing the proposed midnight–6am shift limit, to protect small overnight stations.',
  'motion-2':
    'Confirms the board-prepared annual report for the prior fiscal year as the official record.',
  'motion-4':
    'Requires an overnight broadcast blackout window to reduce infrastructure costs; rejected by members in favor of keeping overnight hours uncapped (motion-3).',
};

const mockMotionComments: Record<string, MotionComment[]> = {
  'motion-5': [
    {
      id: 'c5',
      body: 'Would like to see explicit escalation steps before a ban.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
  ],
  'motion-1': [
    {
      id: 'c1',
      body: 'Mock comment — looks good.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c1-against',
      body: 'This formula underweights overnight shows and should be voted down.',
      authorDisplayName: 'Northern Lights',
      createdAt: new Date().toISOString(),
    },
  ],
  'motion-2': [],
  'motion-3': [
    {
      id: 'c3',
      body: 'Uncapped overnight hours keep small stations off the grid.',
      authorDisplayName: 'Kaiku Collective',
      createdAt: new Date().toISOString(),
    },
  ],
  'motion-4': [
    {
      id: 'c4-for',
      body: 'A blackout would protect overnight presenters.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c4-against',
      body: 'Members rejected this — keep the overnight window open.',
      authorDisplayName: 'Board',
      createdAt: new Date().toISOString(),
    },
  ],
};

export type FetchGovernanceMotionsOpts = {
  limit?: number;
  cursor?: string;
  state?: string;
};

export async function fetchGovernanceMotions(
  opts: FetchGovernanceMotionsOpts = {},
): Promise<{
  data: GovernanceMotion[];
  nextCursor: string | null;
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  const limit = opts.limit ?? 100;
  if (isForceMock()) {
    let start = 0;
    if (opts.cursor) {
      const idx = mockMotions.findIndex((m) => m.id === opts.cursor);
      start = idx >= 0 ? idx + 1 : 0;
    }
    let rows = mockMotions.map((m) => ({ ...m }));
    if (opts.state) {
      const allowed = new Set(
        opts.state
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
      rows = rows.filter((m) => allowed.has(m.state));
    }
    const page = rows.slice(start, start + limit);
    const nextCursor =
      start + limit < rows.length ? (page[page.length - 1]?.id ?? null) : null;
    return {
      data: page,
      nextCursor,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (opts.cursor) {
      qs.set('cursor', opts.cursor);
    }
    if (opts.state) {
      qs.set('state', opts.state);
    }
    const { data, headers } = await requestJson<GovernanceMotion[]>(
      `/api/v1/governance/motions?${qs}`,
    );
    return {
      data,
      nextCursor: headers.get('x-next-cursor'),
      meta: { source: 'api' },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return {
      data: [],
      nextCursor: null,
      meta: apiErrorMeta(err),
      forbidden,
    };
  }
}

export async function fetchGovernanceMotion(
  id: string,
): Promise<
  | { ok: true; data: GovernanceMotionDetail }
  | { ok: false; error: string; forbidden?: boolean }
> {
  if (isForceMock()) {
    const motion = mockMotions.find((m) => m.id === id);
    if (!motion) {
      return { ok: false, error: 'Motion not found' };
    }
    return {
      ok: true,
      data: { ...motion, description: mockMotionDescriptions[id] ?? '' },
    };
  }
  try {
    const data = await getJson<GovernanceMotionDetail>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}`,
    );
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return {
      ok: false,
      error: message || 'Could not load motion',
      forbidden,
    };
  }
}

export async function createGovernanceMotion(input: {
  title: string;
  description: string;
  openAt: string;
  closeAt: string;
  advisory?: boolean;
}): Promise<
  { ok: true; data: GovernanceMotionDraft } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row: GovernanceMotionDraft = {
      id: `motion-${Date.now()}`,
      state: 'DRAFT',
    };
    mockMotions = [
      {
        id: row.id,
        title: input.title,
        state: row.state,
        advisory: true,
        openAt: input.openAt,
        closeAt: input.closeAt,
        proposer: 'You',
        totalVotes: 0,
        youVoted: false,
        commentCount: 0,
      },
      ...mockMotions,
    ];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<GovernanceMotionDraft>(
      '/api/v1/governance/motions',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not submit motion',
    };
  }
}

export async function fetchPublicGovernanceMotions(year?: number): Promise<{
  data: PublicGovernanceMotion[];
  meta: FetchMeta;
}> {
  const query = year ? `?year=${encodeURIComponent(year)}` : '';
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'motion-2',
          title: 'Confirm annual report',
          description:
            'Public mock decision history. Members favored YES — the report stands.',
          closedAt: '2026-02-15T00:00:00.000Z',
          proposer: 'Board',
          voteFor: 10,
          voteAgainst: 1,
          voteAbstain: 1,
        },
        {
          id: 'motion-4',
          title: 'Require overnight radio blackout',
          description:
            'Public mock decision history. Members favored NO — the blackout did not pass.',
          closedAt: '2026-03-01T00:00:00.000Z',
          proposer: 'Board',
          voteFor: 3,
          voteAgainst: 9,
          voteAbstain: 1,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PublicGovernanceMotion[]>(
      `/api/v1/transparency/motions${query}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceMeetings(): Promise<{
  data: GovernanceMeeting[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceMeetings(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceMeeting[]>(
      '/api/v1/governance/meetings',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceDocuments(): Promise<{
  data: GovernanceDocument[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceDocuments(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceDocument[]>(
      '/api/v1/governance/documents',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceMembers(): Promise<{
  data: GovernanceMember[];
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceMembers(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceMember[]>(
      '/api/v1/governance/members',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return { data: [], meta: apiErrorMeta(err), forbidden };
  }
}

export async function fetchGovernanceQuarterlyReports(): Promise<{
  data: GovernanceQuarterlyReport[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceQuarterlyReports(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceQuarterlyReport[]>(
      '/api/v1/governance/quarterly-reports',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function voteOnMotion(
  id: string,
  choice: 'YES' | 'NO' | 'ABSTAIN',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockMotions = mockMotions.map((m) => {
      if (m.id !== id || m.youVoted) {
        return m;
      }
      const tally = { ...(m.tally ?? { YES: 0, NO: 0, ABSTAIN: 0 }) };
      tally[choice] = (tally[choice] ?? 0) + 1;
      return {
        ...m,
        youVoted: true,
        yourChoice: choice,
        totalVotes: (m.totalVotes ?? 0) + 1,
        tally,
      };
    });
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ choice }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Vote failed',
    };
  }
}

/** Board-only motion lifecycle transition — open a DRAFT motion for voting,
 * or close an OPEN one and publish its tally. */
export async function patchGovernanceMotion(
  id: string,
  patch: { state?: 'OPEN' | 'CLOSED'; title?: string; description?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockMotions = mockMotions.map((m) =>
      m.id === id
        ? {
            ...m,
            ...(patch.state ? { state: patch.state } : {}),
            ...(patch.title ? { title: patch.title } : {}),
          }
        : m,
    );
    if (patch.description) {
      mockMotionDescriptions[id] = patch.description;
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/v1/governance/motions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update motion',
    };
  }
}

export async function fetchMotionComments(id: string): Promise<{
  data: MotionComment[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...(mockMotionComments[id] ?? [])],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MotionComment[]>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/comments`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** Comments for several motions in one request — governance list pages
 * need every visible motion's comment thread ready before a card expands,
 * and fetching them one motion at a time doesn't scale past a handful.
 * Capped at 100 ids server-side, matching the motions list's own cap. */
export async function fetchMotionCommentsBulk(ids: string[]): Promise<{
  data: Record<string, MotionComment[]>;
  meta: FetchMeta;
}> {
  if (ids.length === 0) {
    return { data: {}, meta: { source: 'api' } };
  }
  if (isForceMock()) {
    return {
      data: Object.fromEntries(
        ids.map((id) => [id, [...(mockMotionComments[id] ?? [])]]),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<Record<string, MotionComment[]>>(
      `/api/v1/governance/motions/comments?ids=${ids.map(encodeURIComponent).join(',')}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: {}, meta: apiErrorMeta(err) };
  }
}

export async function postMotionComment(
  id: string,
  body: string,
): Promise<{ ok: true; data: MotionComment } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: MotionComment = {
      id: `c-${Date.now()}`,
      body,
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    };
    mockMotionComments[id] = [...(mockMotionComments[id] ?? []), row];
    mockMotions = mockMotions.map((m) =>
      m.id === id ? { ...m, commentCount: (m.commentCount ?? 0) + 1 } : m,
    );
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<MotionComment>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/comments`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Comment failed',
    };
  }
}
