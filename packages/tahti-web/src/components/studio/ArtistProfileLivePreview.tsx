import { useTranslation } from '@tahti-player/i18n';
import { MediaArtwork } from '@tahti-player/ui';

import type { ProfileFields } from '../../api/studio-extras';
import { countryName } from '../../lib/countries';
import { HelpTitle } from '../HelpTitle';
import { Nameplate } from '../Nameplate';

/** Sticky public-page sketch beside Studio → Profile identity / story / people. */
export function ArtistProfileLivePreview({
  profile,
  roleLabels,
}: {
  profile: ProfileFields;
  roleLabels: string[];
}) {
  const { t } = useTranslation('web');
  const location = [profile.defaultLocation, countryName(profile.countryCode)]
    .filter(Boolean)
    .join(', ');
  const bio = (profile.bio ?? '').trim();

  return (
    <aside
      className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-2xl border p-4 lg:sticky lg:top-4"
      data-testid="studio-profile-live-preview"
      aria-label={t('studioProfile.livePreview')}
    >
      <HelpTitle
        as="span"
        titleClassName="text-primary-strong font-mono text-[0.65rem] font-semibold tracking-[0.18em] uppercase"
        title={t('studioProfile.livePreview')}
        help={t('studioProfile.livePreviewHint')}
      />
      <div className="flex gap-3">
        <MediaArtwork
          src={profile.avatarUrl ?? undefined}
          alt=""
          seed={profile.username}
          size="md"
          className="size-16 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display truncate text-lg font-bold tracking-tight">
              {profile.displayName || profile.username}
            </p>
            <Nameplate
              text={profile.nameplateText}
              color={profile.nameplateColor}
            />
          </div>
          <p className="text-foreground-secondary truncate text-sm">
            @{profile.username}
          </p>
          {location ? (
            <p className="text-foreground-secondary mt-0.5 truncate text-xs">
              {location}
            </p>
          ) : null}
        </div>
      </div>
      {roleLabels.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {roleLabels.map((label) => (
            <li
              key={label}
              className="border-border bg-background text-foreground-secondary rounded-md border px-2 py-0.5 text-xs"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}
      {bio ? (
        <p className="text-foreground-secondary line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
          {bio}
        </p>
      ) : (
        <p className="text-foreground-secondary text-sm italic">
          {t('studioProfile.livePreviewEmptyBio')}
        </p>
      )}
    </aside>
  );
}
