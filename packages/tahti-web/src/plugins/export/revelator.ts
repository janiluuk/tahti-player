import { apiBase } from '../../api/http';
import { isForceMock } from '../../api/mode';
import type {
  ExportProvider,
  ExportStatusResult,
  ExportSubmitResult,
} from './provider';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export const revelatorExportProvider: ExportProvider = {
  id: 'revelator',
  label: 'Revelator / DSP delivery',
  behavioral: true,
  async submit(releaseId: string): Promise<ExportSubmitResult> {
    if (isForceMock()) {
      return { ok: true, status: 'pending' };
    }
    try {
      const { data } = await requestJson<{ revelatorStatus?: string }>(
        `/api/me/releases/${encodeURIComponent(releaseId)}/revelator/submit`,
        { method: 'POST' },
      );
      return { ok: true, status: data.revelatorStatus ?? 'pending' };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Submit failed',
      };
    }
  },
  async status(releaseId: string): Promise<ExportStatusResult> {
    if (isForceMock()) {
      return {
        ok: true,
        revelatorId: 'mock-revelator',
        revelatorStatus: 'pending',
        title: 'Mock release',
      };
    }
    try {
      const { data } = await requestJson<{
        revelatorId: string | null;
        revelatorStatus: string | null;
        title: string;
      }>(`/api/me/releases/${encodeURIComponent(releaseId)}/revelator`);
      return {
        ok: true,
        revelatorId: data.revelatorId,
        revelatorStatus: data.revelatorStatus,
        title: data.title,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Status failed',
      };
    }
  },
};
