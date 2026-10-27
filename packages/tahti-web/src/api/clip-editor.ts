import { patchAnnouncementClip } from './announcements';
import type { AnnouncementTrim } from './announcements';
import {
  applyMockClipPreview,
  mockClipPreview,
  mockClipSource,
} from './clip-editor-mock';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type ClipVoiceSettings = AnnouncementTrim & {
  normalize: boolean;
  removeRumble: boolean;
  compress: boolean;
  deEss: boolean;
  warmth: boolean;
  clarity: boolean;
};

export const ORIGINAL_VOICE = {
  normalize: false,
  removeRumble: false,
  compress: false,
  deEss: false,
  warmth: false,
  clarity: false,
};

export type ClipEditorSource = {
  url: string;
  originalUrl: string;
  durationSec: number | null;
  title: string;
  renderStatus: 'READY' | 'PROCESSING' | 'ERROR';
  editorSettings: ClipVoiceSettings | null;
  draftSettings: ClipVoiceSettings | null;
  draftUrl: string | null;
  draftStatus: 'READY' | 'PROCESSING' | 'ERROR' | null;
  renderToken: string | null;
};

export type ClipPlacement = {
  scheduleMode: 'AFTER_EVERY' | 'EVERY_NTH' | 'RANDOM';
  everyNth: number | null;
  placement: 'BETWEEN' | 'BEFORE' | 'AFTER';
  targetSoundId: string | null;
};

const path = (id: string) =>
  `/api/me/announcements/${encodeURIComponent(id)}/editor`;

export async function fetchClipEditorSource(id: string) {
  if (isForceMock()) {
    return mockClipSource(id);
  }
  return (await requestJson<ClipEditorSource>(`${path(id)}/source`)).data;
}

export async function previewClipEdit(id: string, settings: ClipVoiceSettings) {
  if (isForceMock()) {
    return mockClipPreview(id, settings);
  }
  return (
    await requestJson<{ renderToken: string; draftStatus: 'PROCESSING' }>(
      `${path(id)}/preview`,
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
    )
  ).data;
}

export async function applyClipEdit(
  id: string,
  settings: ClipPlacement & {
    title: string;
    isEnabled: boolean;
    renderToken: string;
  },
) {
  if (isForceMock()) {
    applyMockClipPreview(id, settings.renderToken);
    const result = await patchAnnouncementClip(id, settings);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return;
  }
  await requestJson(`${path(id)}/apply`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export function voiceSettingsKey(settings: ClipVoiceSettings | null) {
  return settings
    ? JSON.stringify(
        Object.entries(settings).sort(([a], [b]) => a.localeCompare(b)),
      )
    : '';
}
