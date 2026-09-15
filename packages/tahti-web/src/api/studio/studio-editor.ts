import type { FetchMeta } from '../client';
import { DEMO_MP3 } from '../mock';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';
import { addMockSoundVersion } from '../sound-versions';
import type {
  EditList,
  EditorDraft,
  EditorProjectDetail,
  EditorProjectRow,
  EditorTimeline,
} from '../studio-types';
import { createDefaultEditList } from '../studio-types';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';

let mockProjects: EditorProjectRow[] = [
  {
    id: 'proj-mock-1',
    title: 'Northern Lights — edit',
    soundId: 'arch-mock-1',
    updatedAt: new Date().toISOString(),
  },
];
const mockProjectTimelines = new Map<string, EditorTimeline>();

const mockDrafts = new Map<string, EditorDraft>();

function mockPeaks(durationSec: number) {
  const n = 256;
  const level = Array.from({ length: n }, (_, i) => {
    const t = i / n;
    return (
      0.15 +
      0.7 * Math.abs(Math.sin(t * Math.PI * 8)) * (0.4 + 0.6 * Math.random())
    );
  });
  return { sampleRate: 44100, durationSec, levels: [level] };
}

// ── Editor projects ─────────────────────────────────────────────────────────

export async function fetchEditorProjects(): Promise<{
  data: EditorProjectRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockProjects],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectRow[]>(
      '/api/me/editor/projects',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockProjects], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createEditorProject(input: {
  title?: string;
  soundId?: string;
}): Promise<
  { ok: true; data: EditorProjectRow } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row: EditorProjectRow = {
      id: `proj-mock-${Date.now()}`,
      title: input.title ?? 'Untitled session',
      soundId: input.soundId ?? null,
      updatedAt: new Date().toISOString(),
    };
    mockProjects = [row, ...mockProjects];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<EditorProjectRow>(
      '/api/me/editor/projects',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function fetchEditorProject(id: string): Promise<{
  data: EditorProjectDetail;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const row = mockProjects.find((p) => p.id === id) ?? {
      id,
      title: 'Mock project',
      soundId: 'arch-mock-1',
      updatedAt: new Date().toISOString(),
    };
    return {
      data: {
        ...row,
        timeline: mockProjectTimelines.get(id) ?? {
          version: 1,
          durationSec: 180,
          tracks: [],
        },
        sources: row.soundId
          ? [{ id: row.soundId, title: 'Mock source', url: DEMO_MP3 }]
          : [],
      },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectDetail>(
      `/api/me/editor/projects/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { id, title: 'Unavailable', updatedAt: new Date().toISOString() },
      meta: apiErrorMeta(err),
    };
  }
}

export async function updateEditorProject(
  id: string,
  timeline: EditorTimeline,
): Promise<
  { ok: true; data: EditorProjectDetail } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const project = mockProjects.find((item) => item.id === id);
    if (!project) {
      return { ok: false, error: 'Project not found' };
    }
    mockProjectTimelines.set(id, timeline);
    const next = { ...project, updatedAt: new Date().toISOString(), timeline };
    mockProjects = mockProjects.map((item) => (item.id === id ? next : item));
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<EditorProjectDetail>(
      `/api/me/editor/projects/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ timeline }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function deleteEditorProject(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockProjects = mockProjects.filter((item) => item.id !== id);
    mockProjectTimelines.delete(id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/editor/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

// ── Sound pro editor draft / render ───────────────────────────────────────

export async function fetchEditorDraft(soundId: string): Promise<{
  data: EditorDraft;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const existing = mockDrafts.get(soundId);
    if (existing) {
      return {
        data: existing,
        meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      };
    }
    const item = mockSoundStore.find((a) => a.id === soundId);
    const duration = item?.durationSec ?? 180;
    const draft: EditorDraft = {
      editList: createDefaultEditList(duration),
      updatedAt: new Date().toISOString(),
      editorPeaks: mockPeaks(duration),
    };
    mockDrafts.set(soundId, draft);
    return { data: draft, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<EditorDraft>(
      `/api/me/sound/${encodeURIComponent(soundId)}/editor/draft`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const draft: EditorDraft = {
      editList: createDefaultEditList(180),
      updatedAt: null,
      editorPeaks: mockPeaks(180),
    };
    return { data: draft, meta: apiErrorMeta(err) };
  }
}

export async function saveEditorDraft(
  soundId: string,
  editList: EditList,
  expectedUpdatedAt?: string | null,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    const updatedAt = new Date().toISOString();
    mockDrafts.set(soundId, {
      editList,
      updatedAt,
      editorPeaks: mockPeaks(editList.sourceDuration),
    });
    return { ok: true, updatedAt };
  }
  try {
    const { data } = await requestJson<{ ok: true; updatedAt: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/editor/draft`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          editList,
          ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
        }),
      },
    );
    return { ok: true, updatedAt: data.updatedAt };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function renderEditorDraft(
  soundId: string,
  editList: EditList,
  versionLabel: string,
  /** false = "save as new revision" -- rendered and added to Revision
   * history, but the currently-live version keeps playing until someone
   * activates it there. true = "overwrite" -- goes live immediately. */
  activate = true,
): Promise<
  { ok: true; versionId: string; status: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const row = addMockSoundVersion(soundId, {
      versionLabel,
      activate,
    });
    return { ok: true, versionId: row.id, status: 'READY' };
  }
  try {
    const { data } = await requestJson<{
      ok: true;
      versionId: string;
      versionNumber: number;
      status: string;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/editor/render`, {
      method: 'POST',
      body: JSON.stringify({
        editList,
        versionLabel,
        activate,
        format: 'flac',
      }),
    });
    return { ok: true, versionId: data.versionId, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Render failed',
    };
  }
}
