import type { ArtistLogoFields } from './profile-logo';

/** Artist object on `GET /api/v1/u/:username/profile`. */
export type PublicProfileArtist = ArtistLogoFields & {
  username: string;
  displayName: string;
  bio: string | null;
  /** Optional longer-form history, shown expanded below the short bio. */
  fullBio: string | null;
  avatarUrl: string | null;
  /** Still first frame when `avatarUrl` is an animated GIF. */
  avatarPosterUrl?: string | null;
  tipJarUrl?: string | null;
  tier?: string;
  pronouns?: string | null;
  /** ISO 3166-1 alpha-2; GET /api/v1/u/:username/profile */
  countryCode?: string | null;
  /** ISO datetime of account creation; null when the artist hides it. */
  joinDate?: string | null;
  followerCount?: number | null;
  followingCount?: number | null;
  freeSubscriptionsEnabled?: boolean;
  socialLinks?: Record<string, string> | null;
  /** Short label shown as a coloured pill beside the display name. */
  nameplateText?: string | null;
  /** `#RRGGBB`; null uses the page accent. */
  nameplateColor?: string | null;
  /** False when the artist turned the profile hero off in Settings. */
  showPageHero?: boolean;
};
