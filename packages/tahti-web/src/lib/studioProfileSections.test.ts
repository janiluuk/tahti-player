import { describe, expect, it } from 'vitest';

import {
  legacyProfileSectionRedirect,
  movedProfileSettingsPath,
  profileSectionPath,
} from './studioProfileSections';

describe('legacyProfileSectionRedirect', () => {
  it.each([
    ['story', 'identity', 'story'],
    ['people', 'identity', 'people'],
    ['release-visuals', 'branding', 'release-visuals'],
    ['press-kit', 'gallery', 'press-kit'],
  ])(
    'folds the old %s page into Profile → %s at #%s',
    (section, target, hash) => {
      expect(legacyProfileSectionRedirect(section)).toEqual({
        to: '/studio/profile/$section',
        params: { section: target },
        hash,
        replace: true,
      });
    },
  );

  it.each([
    ['appearance', 'design'],
    ['discovery', 'visibility'],
    ['visibility', 'visibility'],
    ['domain', 'address'],
  ])('moves the old %s page to Channel → %s', (section, target) => {
    expect(legacyProfileSectionRedirect(section)).toEqual({
      to: '/studio/channel/$section',
      params: { section: target },
      replace: true,
    });
  });

  it('leaves current and unknown sections alone', () => {
    expect(legacyProfileSectionRedirect('identity')).toBeNull();
    expect(legacyProfileSectionRedirect('gallery')).toBeNull();
    expect(legacyProfileSectionRedirect('nope')).toBeNull();
    expect(legacyProfileSectionRedirect(undefined)).toBeNull();
  });
});

describe('profileSectionPath', () => {
  it.each([
    ['connections', '/studio/profile/connections'],
    ['people', '/studio/profile/identity#people'],
    ['press-kit', '/studio/profile/gallery#press-kit'],
    ['domain', '/studio/channel/address'],
  ])('links %s to %s', (section, path) => {
    expect(profileSectionPath(section)).toBe(path);
  });

  it('has no path for an unknown section', () => {
    expect(profileSectionPath('nope')).toBeNull();
  });
});

describe('movedProfileSettingsPath', () => {
  it('lands bare Artist and Channel settings on their first tab', () => {
    expect(movedProfileSettingsPath('artist', null)).toBe(
      '/studio/profile/identity',
    );
    expect(movedProfileSettingsPath('channel', null)).toBe(
      '/studio/channel/design',
    );
  });

  it('sends chat, moderators and following to their own homes', () => {
    expect(movedProfileSettingsPath('channel', 'chat')).toBe('/studio/chat');
    expect(movedProfileSettingsPath('channel', 'moderators')).toBe(
      '/studio/chat?section=moderators',
    );
    expect(movedProfileSettingsPath('artist', 'following')).toBe(
      '/library/following',
    );
  });
});
