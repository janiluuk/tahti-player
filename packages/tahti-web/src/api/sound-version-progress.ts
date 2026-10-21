import { apiBase } from './http';
import { isForceMock } from './mode';

export type VersionProgress = {
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR' | string;
  /** 0..1 */
  pct: number;
  phase?: string;
  segment?: number;
  segmentCount?: number;
};

/** Follow a sound version's render over the API's SSE stream until it is
 * READY or ERROR. Returns a function that stops listening. */
export function subscribeToVersionProgress(
  soundId: string,
  versionId: string,
  onProgress: (progress: VersionProgress) => void,
): () => void {
  if (isForceMock() || typeof EventSource === 'undefined') {
    return () => {};
  }
  const source = new EventSource(
    `${apiBase()}/api/me/sound/${encodeURIComponent(soundId)}/versions/${encodeURIComponent(versionId)}/progress`,
    { withCredentials: true },
  );
  source.onmessage = (message) => {
    try {
      const progress = JSON.parse(message.data) as VersionProgress;
      onProgress(progress);
      if (progress.status === 'READY' || progress.status === 'ERROR') {
        source.close();
      }
    } catch {
      // A keep-alive or malformed frame; the next one will do.
    }
  };
  source.onerror = () => source.close();
  return () => source.close();
}
