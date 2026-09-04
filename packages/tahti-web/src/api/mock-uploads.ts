export type MockUploadedSound = {
  id: string;
  title: string;
  filename: string;
  objectUrl: string;
  channelSlug: string;
  downloadsEnabled: boolean;
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'STASH';
  accessMode?: 'FREE' | 'SUBSCRIBERS_ONLY' | 'PURCHASE';
  purchaseTierId?: string | null;
  /** Base64 of original bytes so blob URLs can be recreated after reload. */
  fileDataBase64?: string;
  mimeType?: string;
};

const uploads = new Map<string, MockUploadedSound>();

const STORAGE_KEY = 'tahti-mock-uploaded-sounds';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function hydrateObjectUrl(row: MockUploadedSound): MockUploadedSound {
  if (!row.fileDataBase64) {
    return row;
  }
  const bytes = base64ToUint8Array(row.fileDataBase64);
  const blob = new Blob([bytes], {
    type: row.mimeType || 'application/octet-stream',
  });
  return { ...row, objectUrl: URL.createObjectURL(blob) };
}

export async function registerMockUploadedSound(
  sound: MockUploadedSound,
): Promise<MockUploadedSound> {
  let fileDataBase64 = sound.fileDataBase64;
  let mimeType = sound.mimeType;
  if (!fileDataBase64 && sound.objectUrl) {
    try {
      const response = await fetch(sound.objectUrl);
      const buffer = await response.arrayBuffer();
      fileDataBase64 = arrayBufferToBase64(buffer);
      mimeType =
        mimeType ||
        response.headers.get('content-type') ||
        'application/octet-stream';
    } catch {
      // Keep the live objectUrl for this session even if bytes cannot be snapshotted.
    }
  }
  const row: MockUploadedSound = {
    ...sound,
    fileDataBase64,
    mimeType,
  };
  uploads.set(row.id, row);
  persistIndex();
  return row;
}

export function getMockUploadedSound(id: string): MockUploadedSound | null {
  const memory = uploads.get(id);
  if (memory) {
    return memory;
  }
  const persisted = readPersisted().find((row) => row.id === id);
  if (!persisted) {
    return null;
  }
  const hydrated = hydrateObjectUrl(persisted);
  uploads.set(hydrated.id, hydrated);
  return hydrated;
}

export function listMockUploadedSounds(): MockUploadedSound[] {
  const fromMemory = Array.from(uploads.values());
  if (fromMemory.length > 0) {
    return fromMemory;
  }
  return readPersisted().map((row) => {
    const hydrated = hydrateObjectUrl(row);
    uploads.set(hydrated.id, hydrated);
    return hydrated;
  });
}

export function patchMockUploadedSound(
  id: string,
  patch: Partial<MockUploadedSound>,
): void {
  const current = getMockUploadedSound(id);
  if (!current) {
    return;
  }
  uploads.set(id, { ...current, ...patch });
  persistIndex();
}

function persistIndex(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const rows = Array.from(uploads.values()).map((row) => ({
    id: row.id,
    title: row.title,
    filename: row.filename,
    objectUrl: row.objectUrl,
    channelSlug: row.channelSlug,
    downloadsEnabled: row.downloadsEnabled,
    visibility: row.visibility,
    accessMode: row.accessMode ?? 'FREE',
    purchaseTierId: row.purchaseTierId ?? null,
    fileDataBase64: row.fileDataBase64,
    mimeType: row.mimeType,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function readPersisted(): MockUploadedSound[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as MockUploadedSound[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
