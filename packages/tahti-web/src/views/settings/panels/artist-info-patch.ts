import type { ProfileFields, ProfilePatch } from '../../../api/studio-extras';

export function buildArtistInfoPatch(
  profile: ProfileFields,
  artistRoles: string[],
): ProfilePatch {
  return {
    displayName: profile.displayName.trim(),
    bio: profile.bio?.trim() ?? '',
    fullBio: profile.fullBio?.trim() || null,
    tipJarUrl: profile.tipJarUrl?.trim() ?? '',
    pronouns: profile.pronouns?.trim() || null,
    chatEnabled: profile.chatEnabled,
    showFollowers: profile.showFollowers,
    showFollowing: profile.showFollowing,
    artistKind: profile.artistKind ?? 'SINGLE',
    countryCode: profile.countryCode,
    defaultLocation: profile.defaultLocation?.trim() || null,
    socialLinks: {
      ...(profile.socialLinks ?? {}),
      artistRoles: artistRoles.join(', '),
    },
  };
}
