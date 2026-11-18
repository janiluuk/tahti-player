import { i18n } from '@tahti-player/i18n';

import { requestJson } from './client-request';
import type { MotionComment } from './governance-member';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import type { FeatureRequest } from './types';

let mockFeatureRequests: FeatureRequest[] | null = null;
let mockFeatureRequestComments: Record<string, MotionComment[]> | null = null;

function featureRequestFixtures(): FeatureRequest[] {
  mockFeatureRequests ??= [
    {
      id: 'fr-1',
      title: 'Crossfade between archive tracks',
      description:
        'Would love a short crossfade option on the archive player, same as the 24/7 rotation already has.',
      status: 'PLANNED',
      proposer: 'Demo Member',
      voteCount: 6,
      youVoted: false,
      commentCount: 1,
      reviewNote: null,
      reviewedAt: null,
      mergedIntoId: null,
      mergedIntoTitle: null,
      createdAt: new Date(Date.now() - 86_400_000 * 5).toISOString(),
    },
    {
      id: 'fr-2',
      title: 'Bulk-tag tracks in the archive',
      description:
        'Selecting multiple archive items and applying a genre or visibility change at once would save a lot of clicking.',
      status: 'OPEN',
      proposer: 'Northern Lights',
      voteCount: 2,
      youVoted: false,
      commentCount: 1,
      reviewNote: null,
      reviewedAt: null,
      mergedIntoId: null,
      mergedIntoTitle: null,
      createdAt: new Date(Date.now() - 86_400_000 * 1).toISOString(),
    },
    {
      id: 'fr-3',
      title: 'Show listening history on Listen',
      description:
        'Members asked for a History tab. The board closed this after it shipped.',
      status: 'DONE',
      proposer: 'Kaiku Collective',
      voteCount: 12,
      youVoted: true,
      commentCount: 2,
      reviewNote: 'Resolved: Listen now has a History tab.',
      reviewedAt: new Date(Date.now() - 86_400_000 * 20).toISOString(),
      mergedIntoId: null,
      mergedIntoTitle: null,
      createdAt: new Date(Date.now() - 86_400_000 * 40).toISOString(),
    },
  ];
  return mockFeatureRequests;
}

function featureRequestCommentFixtures(): Record<string, MotionComment[]> {
  mockFeatureRequestComments ??= {
    'fr-1': [
      {
        id: 'frc-1',
        body: 'Mock comment — agreed, this would help a lot during transitions.',
        authorDisplayName: 'Demo Member',
        createdAt: new Date().toISOString(),
      },
    ],
    'fr-2': [
      {
        id: 'frc-2-need',
        body: 'This is still unresolved — tagging one track at a time does not scale.',
        authorDisplayName: 'Northern Lights',
        createdAt: new Date().toISOString(),
      },
    ],
    'fr-3': [
      {
        id: 'frc-3-ask',
        body: 'We needed a place to find what we already played.',
        authorDisplayName: 'Kaiku Collective',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'frc-3-done',
        body: 'Resolved — History is on the Listen tab row.',
        authorDisplayName: 'Board',
        createdAt: new Date().toISOString(),
      },
    ],
  };
  return mockFeatureRequestComments;
}

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

function messageOr(err: unknown, message: string): string {
  return err instanceof Error && err.message ? err.message : message;
}

export async function fetchFeatureRequests(): Promise<{
  data: FeatureRequest[];
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  if (isForceMock()) {
    return {
      data: featureRequestFixtures().map((row) => ({ ...row })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FeatureRequest[]>(
      '/api/v1/governance/feature-requests',
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

export async function createFeatureRequest(input: {
  title: string;
  description: string;
}): Promise<{ ok: true; data: FeatureRequest } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: FeatureRequest = {
      id: `fr-${Date.now()}`,
      title: input.title,
      description: input.description,
      status: 'OPEN',
      proposer: 'You',
      voteCount: 0,
      youVoted: false,
      commentCount: 0,
      reviewNote: null,
      reviewedAt: null,
      mergedIntoId: null,
      mergedIntoTitle: null,
      createdAt: new Date().toISOString(),
    };
    mockFeatureRequests = [row, ...featureRequestFixtures()];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<FeatureRequest>(
      '/api/v1/governance/feature-requests',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageOr(err, i18n.t('web:batch55.couldNotSubmitIdea')),
    };
  }
}

export async function voteFeatureRequest(
  id: string,
  vote: boolean,
): Promise<{ ok: true; voteCount: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    let voteCount = 0;
    mockFeatureRequests = featureRequestFixtures().map((row) => {
      if (row.id !== id) {
        return row;
      }
      voteCount = Math.max(0, row.voteCount + (vote ? 1 : -1));
      return { ...row, youVoted: vote, voteCount };
    });
    return { ok: true, voteCount };
  }
  try {
    const { data } = await requestJson<{ ok: true; voteCount: number }>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/vote`,
      { method: vote ? 'POST' : 'DELETE' },
    );
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Vote failed',
    };
  }
}

export async function fetchFeatureRequestComments(id: string): Promise<{
  data: MotionComment[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...(featureRequestCommentFixtures()[id] ?? [])],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MotionComment[]>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/comments`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function postFeatureRequestComment(
  id: string,
  body: string,
): Promise<{ ok: true; data: MotionComment } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: MotionComment = {
      id: `frc-${Date.now()}`,
      body,
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    };
    const comments = featureRequestCommentFixtures();
    comments[id] = [...(comments[id] ?? []), row];
    mockFeatureRequests = featureRequestFixtures().map((request) =>
      request.id === id
        ? { ...request, commentCount: request.commentCount + 1 }
        : request,
    );
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<MotionComment>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/comments`,
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
