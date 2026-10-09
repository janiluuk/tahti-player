import { loadStemFilesOntoMultitrack } from '@tahti-player/audio-editor';

export type StemFileRef = { label: string; url: string };

async function fetchStemBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Could not download stem (${res.status})`);
  }
  return res.blob();
}

/** Fetch each stem URL and load it as its own Multitrack lane. */
export async function sendStemFilesToMultitrack(
  files: StemFileRef[],
): Promise<{ ok: true; trackIds: string[] } | { ok: false; error: string }> {
  if (files.length === 0) {
    return { ok: false, error: 'No stem files to load.' };
  }
  try {
    const loaded: Array<{ label: string; blob: Blob }> = [];
    for (const file of files) {
      const blob = await fetchStemBlob(file.url);
      loaded.push({ label: file.label || 'Stem', blob });
    }
    const trackIds = await loadStemFilesOntoMultitrack(loaded);
    return { ok: true, trackIds };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load stems.',
    };
  }
}
