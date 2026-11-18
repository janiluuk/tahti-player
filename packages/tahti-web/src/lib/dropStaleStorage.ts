/** localStorage keys nothing reads any more. The browser-decoded waveform
 * cache could hold several hundred KB of peaks; waveforms now come only
 * from the server. */
export const STALE_STORAGE_KEYS = ['tahti.decodedPeaks.v1'] as const;

export function dropStaleStorage(
  storage: Pick<Storage, 'removeItem'> | undefined = globalThis.localStorage,
): void {
  for (const key of STALE_STORAGE_KEYS) {
    try {
      storage?.removeItem(key);
    } catch {
      return;
    }
  }
}
