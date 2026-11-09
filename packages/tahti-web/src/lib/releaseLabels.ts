import type { TFunction } from '@tahti-player/i18n';

export const RELEASE_TYPE_LABEL_KEYS = {
  SINGLE: 'studioReleases.typeSingle',
  EP: 'studioReleases.typeEp',
  ALBUM: 'studioReleases.typeAlbum',
  COMPILATION: 'studioReleases.typeCompilation',
} as const;

const RELEASE_STATE_KEYS = {
  DRAFT: 'studioReleases.stateDraft',
  SCHEDULED: 'studioReleases.stateScheduled',
  PUBLISHED: 'studioReleases.statePublished',
} as const;

/** "Album", "EP" in the current language; an unknown type reads as sentence
 * case rather than a raw enum. */
export function releaseTypeLabel(type: string, t: TFunction<'web'>): string {
  const key =
    RELEASE_TYPE_LABEL_KEYS[type as keyof typeof RELEASE_TYPE_LABEL_KEYS];
  return key ? t(key) : sentenceCase(type);
}

export function releaseStateLabel(state: string, t: TFunction<'web'>): string {
  const key = RELEASE_STATE_KEYS[state as keyof typeof RELEASE_STATE_KEYS];
  return key ? t(key) : sentenceCase(state);
}

function sentenceCase(value: string): string {
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
