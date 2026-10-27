import type { ClipEditorSource, ClipVoiceSettings } from './clip-editor';

const sources = new Map<string, ClipEditorSource>();

export function registerMockClipSource(id: string, file: File) {
  const previous = sources.get(id);
  if (previous?.originalUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previous.originalUrl);
  }
  const url = URL.createObjectURL(file);
  sources.set(id, {
    url,
    originalUrl: url,
    durationSec: null,
    title: file.name,
    renderStatus: 'READY',
    editorSettings: null,
    draftSettings: null,
    draftUrl: null,
    draftStatus: null,
    renderToken: null,
  });
}

export function removeMockClipSource(id: string) {
  const source = sources.get(id);
  if (source?.originalUrl.startsWith('blob:')) {
    URL.revokeObjectURL(source.originalUrl);
  }
  sources.delete(id);
}

export function mockClipSource(id: string): ClipEditorSource {
  const existing = sources.get(id);
  if (existing) {
    return { ...existing };
  }
  const samples = 8000 * 8;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(bytes);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  text(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    view.setInt16(
      44 + i * 2,
      Math.sin((i * 2 * Math.PI * 220) / 8000) * 2500,
      true,
    );
  }
  registerMockClipSource(
    id,
    new File([bytes], 'Demo station ID.wav', { type: 'audio/wav' }),
  );
  const result = sources.get(id)!;
  result.durationSec = 8;
  return { ...result };
}

export function mockClipPreview(id: string, settings: ClipVoiceSettings) {
  const source = mockClipSource(id);
  const renderToken = crypto.randomUUID();
  sources.set(id, {
    ...source,
    draftSettings: { ...settings },
    draftStatus: 'READY',
    renderToken,
    draftUrl: source.originalUrl,
  });
  return { renderToken, draftStatus: 'PROCESSING' as const };
}

export function applyMockClipPreview(id: string, token: string) {
  const source = sources.get(id);
  if (
    !source ||
    source.renderToken !== token ||
    source.draftStatus !== 'READY'
  ) {
    throw new Error('Generate a fresh preview before saving.');
  }
  sources.set(id, {
    ...source,
    editorSettings: source.draftSettings,
    draftSettings: null,
    renderToken: null,
    draftStatus: null,
    draftUrl: null,
  });
}
