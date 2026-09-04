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
};

const uploads = new Map<string, MockUploadedSound>();

export function registerMockUploadedSound(
  sound: MockUploadedSound,
): MockUploadedSound {
  uploads.set(sound.id, sound);
  persistIndex();
  return sound;
}

export function getMockUploadedSound(id: string): MockUploadedSound | null {
  const memory = uploads.get(id);
  if (memory) {
    return memory;
  }
  return readPersisted().find((row) => row.id === id) ?? null;
}

export function listMockUploadedSounds(): MockUploadedSound[] {
  const fromMemory = Array.from(uploads.values());
  if (fromMemory.length > 0) {
    return fromMemory;
  }
  return readPersisted();
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

const STORAGE_KEY = 'tahti-mock-uploaded-sounds';

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
