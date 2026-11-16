import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import {
  POST_CATEGORIES,
  postActivityLabel,
  postCategoryLabel,
  releaseActivityLabel,
} from './postLabels';
import { releaseStateLabel, releaseTypeLabel } from './releaseLabels';

describe('post and feed labels', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('names every post category in English and Finnish', () => {
    const en = i18n.getFixedT('en_US', 'web');
    const fi = i18n.getFixedT('fi_FI', 'web');
    expect(POST_CATEGORIES.map((c) => postCategoryLabel(c, en))).toEqual([
      'Story',
      'News',
      'Announcement',
    ]);
    expect(postCategoryLabel('NEWS', fi)).toBe('Uutinen');
    expect(postActivityLabel('ANNOUNCEMENT', fi)).toBe('julkaisi tiedotteen');
  });

  it('treats a missing post category as a story', () => {
    const en = i18n.getFixedT('en_US', 'web');
    expect(postCategoryLabel(null, en)).toBe('Story');
    expect(postActivityLabel(undefined, en)).toBe('shared a story');
  });

  it('says what kind of release was put out', () => {
    const en = i18n.getFixedT('en_US', 'web');
    const fi = i18n.getFixedT('fi_FI', 'web');
    expect(releaseActivityLabel('EP', en)).toBe('released an EP');
    expect(releaseActivityLabel('REMIX', fi)).toBe('julkaisi remixin');
    expect(releaseActivityLabel('BOX_SET', en)).toBe('released new music');
  });

  it('reads a release header as words, not enums', () => {
    const en = i18n.getFixedT('en_US', 'web');
    expect(
      `${releaseTypeLabel('EP', en)} · ${releaseStateLabel('DRAFT', en)}`,
    ).toBe('EP · Draft');
    expect(releaseTypeLabel('REMIX', en)).toBe('Remix');
  });
});
