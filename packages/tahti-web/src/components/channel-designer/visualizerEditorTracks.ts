import type { StudioSound } from '../../api/studio-types';

/** Tracks that can drive the visualization editor preview. */
export function isVisualizerEditorTrack(sound: StudioSound): boolean {
  if (sound.status !== 'READY') {
    return false;
  }
  if (sound.embedProvider) {
    return false;
  }
  return true;
}

export function filterVisualizerEditorTracks(
  sounds: readonly StudioSound[],
): StudioSound[] {
  return sounds.filter(isVisualizerEditorTrack);
}

export function formatTrackDuration(
  seconds: number | null | undefined,
): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return '';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
