import type { TFunction } from '@tahti-player/i18n';

import type { PostCategory } from '../api/community-stories';

export const POST_CATEGORIES: readonly PostCategory[] = [
  'STORY',
  'NEWS',
  'ANNOUNCEMENT',
];

const CATEGORY_KEYS = {
  STORY: 'postLabels.categoryStory',
  NEWS: 'postLabels.categoryNews',
  ANNOUNCEMENT: 'postLabels.categoryAnnouncement',
} as const;

const ACTIVITY_KEYS = {
  STORY: 'postLabels.activityStory',
  NEWS: 'postLabels.activityNews',
  ANNOUNCEMENT: 'postLabels.activityAnnouncement',
} as const;

const RELEASE_ACTIVITY_KEYS = {
  SINGLE: 'postLabels.releasedSingle',
  EP: 'postLabels.releasedEp',
  ALBUM: 'postLabels.releasedAlbum',
  COMPILATION: 'postLabels.releasedCompilation',
  REMIX: 'postLabels.releasedRemix',
} as const;

/** "Story", "News", "Announcement"; an unknown or missing category is a story. */
export function postCategoryLabel(
  category: string | null | undefined,
  t: TFunction<'web'>,
): string {
  return t(
    CATEGORY_KEYS[category as keyof typeof CATEGORY_KEYS] ??
      CATEGORY_KEYS.STORY,
  );
}

/** The verb on a story pill after the artist's name ("shared news"). */
export function postActivityLabel(
  category: string | null | undefined,
  t: TFunction<'web'>,
): string {
  return t(
    ACTIVITY_KEYS[category as keyof typeof ACTIVITY_KEYS] ??
      ACTIVITY_KEYS.STORY,
  );
}

/** "released an EP"; an unknown type reads "released new music". */
export function releaseActivityLabel(
  releaseType: string,
  t: TFunction<'web'>,
): string {
  const key =
    RELEASE_ACTIVITY_KEYS[releaseType as keyof typeof RELEASE_ACTIVITY_KEYS];
  return t(key ?? 'postLabels.releasedMusic');
}
