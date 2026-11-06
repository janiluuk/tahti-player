/** Peaks decoded in the browser for tracks the API has none for. Kept in
 * memory and in localStorage (downsampled) under a stable key, e.g. the
 * track id: audio URLs are signed and change on every load, so keying by
 * URL never hits after a reload. Each entry remembers the audio it came
 * from (duration and file path), and a lookup for different audio drops it
 * so the waveform is decoded again only when the audio changed. */

type Entry = { peaks: number[][]; duration: number; version?: string };

/** What the caller knows about the audio right now; unknown parts skip
 * their check. */
export type DecodedPeaksAudio = {
  durationSec?: number | null;
  version?: string | null;
};

type Stored = { p: number[]; d: number; v?: string };

const STORAGE_KEY = 'tahti.decodedPeaks.v1';
const MEMORY_LIMIT = 100;
const STORED_LIMIT = 300;
const STORED_POINTS = 512;

const memory = new Map<string, Entry>();
let stored: Record<string, Stored> | null = null;

function readStored(): Record<string, Stored> {
  if (stored) {
    return stored;
  }
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    stored = raw ? ((JSON.parse(raw) as typeof stored) ?? {}) : {};
  } catch {
    stored = {};
  }
  return stored!;
}

function downsample(channel: number[], points: number): number[] {
  if (channel.length <= points) {
    return channel.map((value) => Math.round(Math.abs(value) * 1000) / 1000);
  }
  const step = channel.length / points;
  const out: number[] = [];
  for (let i = 0; i < points; i += 1) {
    let max = 0;
    const end = Math.min(channel.length, Math.floor((i + 1) * step));
    for (let j = Math.floor(i * step); j < end; j += 1) {
      max = Math.max(max, Math.abs(channel[j]!));
    }
    out.push(Math.round(max * 1000) / 1000);
  }
  return out;
}

/** The audio file a URL points at: signed URLs keep the object path and
 * only change the query, so the path changes only with new audio. */
export function audioVersionFromUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url, 'http://local.invalid');
    return parsed.origin === 'http://local.invalid'
      ? parsed.pathname
      : `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

const DURATION_TOLERANCE_SEC = 1;

function isStale(entry: Entry, audio?: DecodedPeaksAudio): boolean {
  const expected = audio?.durationSec;
  if (
    expected != null &&
    expected > DURATION_TOLERANCE_SEC &&
    entry.duration > 0 &&
    Math.abs(entry.duration - expected) > DURATION_TOLERANCE_SEC
  ) {
    return true;
  }
  return Boolean(
    audio?.version && entry.version && entry.version !== audio.version,
  );
}

function forget(key: string): void {
  memory.delete(key);
  const all = readStored();
  if (!(key in all)) {
    return;
  }
  delete all[key];
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Blocked storage: the stale entry is already gone from memory.
  }
}

export function getDecodedPeaks(
  key: string,
  audio?: DecodedPeaksAudio,
): Entry | undefined {
  let entry = memory.get(key);
  if (!entry) {
    const saved = readStored()[key];
    if (!saved) {
      return undefined;
    }
    entry = { peaks: [saved.p], duration: saved.d, version: saved.v };
    memory.set(key, entry);
  }
  if (isStale(entry, audio)) {
    forget(key);
    return undefined;
  }
  return entry;
}

export function setDecodedPeaks(key: string, entry: Entry): void {
  if (memory.size >= MEMORY_LIMIT) {
    memory.delete(memory.keys().next().value!);
  }
  memory.set(key, entry);
  const first = entry.peaks[0];
  if (!first?.length) {
    return;
  }
  const all = readStored();
  delete all[key];
  all[key] = {
    p: downsample(first, STORED_POINTS),
    d: entry.duration,
    ...(entry.version ? { v: entry.version } : {}),
  };
  const keys = Object.keys(all);
  for (const old of keys.slice(0, Math.max(0, keys.length - STORED_LIMIT))) {
    delete all[old];
  }
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: the in-memory copy still serves this session.
  }
}

export function clearDecodedPeaksForTests(): void {
  memory.clear();
  stored = null;
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage in the test environment is fine.
  }
}
