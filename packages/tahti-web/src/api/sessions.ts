import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type DeviceSession = {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  current: boolean;
};

export async function fetchDeviceSessions(): Promise<{
  data: DeviceSession[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'mock-session-current',
          deviceLabel: 'This browser',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          current: true,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ sessions: DeviceSession[] }>(
      '/api/me/sessions',
    );
    return { data: data.sessions, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function revokeDeviceSession(id: string): Promise<void> {
  if (isForceMock()) {
    return;
  }
  await requestJson(`/api/me/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function revokeAllDeviceSessions(): Promise<void> {
  if (isForceMock()) {
    return;
  }
  await requestJson('/api/me/sessions', { method: 'DELETE' });
}
