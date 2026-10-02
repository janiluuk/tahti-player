import { describe, expect, it } from 'vitest';

import type { ProfileFields } from '../../../api/studio-extras';
import { buildArtistInfoPatch } from './artist-info-patch';

const profile: ProfileFields = {
  id: 'u1',
  username: 'demo',
  displayName: ' Demo ',
  bio: '   ',
  fullBio: '',
  tipJarUrl: '',
  pronouns: '',
  chatEnabled: true,
  freeSubscriptionsEnabled: false,
  countryCode: 'FI',
  defaultLocation: ' ',
};

describe('buildArtistInfoPatch', () => {
  it('clears bio and tip jar with an empty string, not null', () => {
    const patch = buildArtistInfoPatch(profile, []);
    expect(patch.bio).toBe('');
    expect(patch.tipJarUrl).toBe('');
  });

  it('clears the fields the API allows to be null with null', () => {
    const patch = buildArtistInfoPatch(profile, []);
    expect(patch.fullBio).toBeNull();
    expect(patch.pronouns).toBeNull();
    expect(patch.defaultLocation).toBeNull();
  });

  it('sends bio and tip jar empty when the profile has none stored', () => {
    const patch = buildArtistInfoPatch(
      { ...profile, bio: null, tipJarUrl: null },
      [],
    );
    expect(patch.bio).toBe('');
    expect(patch.tipJarUrl).toBe('');
  });

  it('trims filled values and joins artist roles', () => {
    const patch = buildArtistInfoPatch(
      { ...profile, bio: ' Hi ', tipJarUrl: ' https://ko-fi.com/x ' },
      ['DJ', 'Producer'],
    );
    expect(patch).toMatchObject({
      displayName: 'Demo',
      bio: 'Hi',
      tipJarUrl: 'https://ko-fi.com/x',
      socialLinks: { artistRoles: 'DJ, Producer' },
    });
  });
});
