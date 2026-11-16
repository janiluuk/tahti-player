import type { TFunction } from '@tahti-player/i18n';

const SOUND_STATUS_KEYS = {
  PENDING: 'soundStatus.pending',
  PROCESSING: 'soundStatus.processing',
  READY: 'soundStatus.ready',
  ERROR: 'soundStatus.error',
} as const;

/** A sound or audio version's processing status (the API's `SoundStatus`)
 * in the current language; an unknown value reads in sentence case. */
export function soundStatusLabel(status: string, t: TFunction<'web'>): string {
  const key = SOUND_STATUS_KEYS[status as keyof typeof SOUND_STATUS_KEYS];
  if (key) {
    return t(key);
  }
  const words = status.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
