import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type MotionSeconder = {
  displayName: string;
  username: string;
  secondedAt: string;
};

const mockSeconders: Record<string, MotionSeconder[]> = {
  'motion-5': [
    {
      displayName: 'Kaiku Collective',
      username: 'kaiku',
      secondedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

function motionPath(id: string): string {
  return `/api/v1/governance/motions/${encodeURIComponent(id)}`;
}

export async function fetchMotionSeconders(
  id: string,
): Promise<{ data: MotionSeconder[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: [...(mockSeconders[id] ?? [])],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MotionSeconder[]>(
      `${motionPath(id)}/seconds`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
