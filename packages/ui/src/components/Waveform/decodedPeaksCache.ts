/** Peaks decoded in the browser for tracks the API has none for. Kept in
 * memory and in localStorage (downsampled) under a stable key, e.g. the
 * track id: audio URLs are signed and change on every load, so keying by
 * URL never hits after a reload. */

type Entry = { peaks: number[][]; duration: number };

const STORAGE_KEY = 'tahti.decodedPeaks.v1';
const MEMORY_LIMIT = 100;
const STORED_LIMIT = 300;
const STORED_POINTS = 512;

const memory = new Map<string, Entry>();
let stored: Record<string, { p: number[]; d: number }> | null = null;

function readStored(): Record<string, { p: number[]; d: number }> {
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

export function getDecodedPeaks(key: string): Entry | undefined {
  const hit = memory.get(key);
  if (hit) {
    return hit;
  }
  const saved = readStored()[key];
  if (!saved) {
    return undefined;
  }
  const entry = { peaks: [saved.p], duration: saved.d };
  memory.set(key, entry);
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
  all[key] = { p: downsample(first, STORED_POINTS), d: entry.duration };
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
