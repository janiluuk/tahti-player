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
  mimeType?: string;
};

const uploads = new Map<string, MockUploadedSound>();

const STORAGE_KEY = 'tahti-mock-uploaded-sounds';
const IDB_NAME = 'tahti-mock-uploaded-sounds-db';
const IDB_STORE = 'files';
const IDB_VERSION = 1;

type PersistedMeta = {
  id: string;
  title: string;
  filename: string;
  channelSlug: string;
  downloadsEnabled: boolean;
  visibility: MockUploadedSound['visibility'];
  accessMode?: MockUploadedSound['accessMode'];
  purchaseTierId?: string | null;
  mimeType?: string;
  hasFileBytes?: boolean;
};

type StoredFile = {
  blob: Blob;
  mimeType: string;
};

function openFileDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onerror = () => resolve(null);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
    } catch {
      resolve(null);
    }
  });
}

async function idbPutFile(id: string, payload: StoredFile): Promise<void> {
  const db = await openFileDb();
  if (!db) {
    return;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(payload, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
  try {
    db.close();
  } catch {
    // ignore
  }
}

async function idbGetFile(id: string): Promise<StoredFile | null> {
  const db = await openFileDb();
  if (!db) {
    return null;
  }
  const result = await new Promise<StoredFile | null>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).get(id);
      request.onsuccess = () => {
        const value = request.result as StoredFile | undefined;
        resolve(value?.blob ? value : null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  try {
    db.close();
  } catch {
    // ignore
  }
  return result;
}

function hydrateFromBlob(
  row: PersistedMeta | MockUploadedSound,
  file: StoredFile,
): MockUploadedSound {
  return {
    id: row.id,
    title: row.title,
    filename: row.filename,
    channelSlug: row.channelSlug,
    downloadsEnabled: row.downloadsEnabled,
    visibility: row.visibility,
    accessMode: row.accessMode,
    purchaseTierId: row.purchaseTierId,
    mimeType: file.mimeType || row.mimeType,
    objectUrl: URL.createObjectURL(file.blob),
  };
}

export async function registerMockUploadedSound(
  sound: MockUploadedSound,
): Promise<MockUploadedSound> {
  let mimeType = sound.mimeType || 'application/octet-stream';
  let blob: Blob | null = null;
  if (sound.objectUrl) {
    try {
      const response = await fetch(sound.objectUrl);
      blob = await response.blob();
      mimeType = sound.mimeType || blob.type || mimeType;
    } catch {
      // Keep the live objectUrl for this session even if bytes cannot be snapshotted.
    }
  }
  const row: MockUploadedSound = {
    ...sound,
    mimeType,
  };
  uploads.set(row.id, row);
  persistIndex(Boolean(blob));
  if (blob) {
    await idbPutFile(row.id, { blob, mimeType });
  }
  return row;
}

export function getMockUploadedSound(id: string): MockUploadedSound | null {
  return uploads.get(id) ?? null;
}

export async function ensureMockUploadedSound(
  id: string,
): Promise<MockUploadedSound | null> {
  const memory = uploads.get(id);
  if (memory?.objectUrl) {
    return memory;
  }
  const meta = readPersisted().find((row) => row.id === id) ?? null;
  if (!meta) {
    return null;
  }
  const file = await idbGetFile(id);
  if (!file) {
    return {
      ...meta,
      objectUrl: '',
    };
  }
  const hydrated = hydrateFromBlob(meta, file);
  uploads.set(hydrated.id, hydrated);
  return hydrated;
}

export function patchMockUploadedSound(
  id: string,
  patch: Partial<MockUploadedSound>,
): void {
  const current =
    uploads.get(id) ?? readPersisted().find((row) => row.id === id);
  if (!current) {
    return;
  }
  const next: MockUploadedSound = {
    objectUrl: 'objectUrl' in current ? current.objectUrl : '',
    ...current,
    ...patch,
  };
  uploads.set(id, next);
  persistIndex(true);
}

function persistIndex(hasFileBytes: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const rows: PersistedMeta[] = Array.from(uploads.values()).map((row) => ({
    id: row.id,
    title: row.title,
    filename: row.filename,
    channelSlug: row.channelSlug,
    downloadsEnabled: row.downloadsEnabled,
    visibility: row.visibility,
    accessMode: row.accessMode ?? 'FREE',
    purchaseTierId: row.purchaseTierId ?? null,
    mimeType: row.mimeType,
    hasFileBytes,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Metadata only; file bytes live in IndexedDB.
  }
}

function readPersisted(): PersistedMeta[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PersistedMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
