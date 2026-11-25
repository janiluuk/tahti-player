import { ImageIcon, PencilIcon } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, MediaArtwork, Tooltip } from '@tahti-player/ui';

import type { ProfileFields } from '../../../api/studio-extras';
import { artistHeroImage } from '../../../lib/avatarTheme';
import { cn } from '../../../lib/cn';
import { ProfileBackdropDialog } from './ProfileBackdropDialog';
import { ProfilePictureDialog } from './ProfilePictureDialog';
import { useProfileAvatar } from './useProfileAvatar';

/** Hidden at rest only where a fine pointer can hover; touch always sees it. */
const editChipReveal =
  'opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100';

const editChip = cn(
  'bg-background/90 text-foreground border-border pointer-events-none flex size-9 items-center justify-center rounded-full border shadow-sm',
  editChipReveal,
);

/** Studio → Profile → Identity header: the profile backdrop as a banner with
 * the profile picture overlapping its lower edge, as on the public artist
 * page. Each image opens its own change dialog. */
export function ProfileIdentityHeader({
  profile,
  setProfile,
}: {
  profile: ProfileFields;
  setProfile: Dispatch<SetStateAction<ProfileFields | null>>;
}) {
  const { t } = useTranslation('web');
  const [backdropOpen, setBackdropOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { handleAvatarChange, removeAvatar } = useProfileAvatar(setProfile);
  const backdropUrl = profile.backdropUrl ?? null;
  const avatarUrl = profile.avatarUrl ?? null;
  const hero = artistHeroImage({
    username: profile.username,
    avatarUrl,
    avatarTheme: profile.avatarTheme,
  });
  const changeBackdrop = t('profileHeader.changeBackdrop');
  const changeAvatar = t('profileHeader.changeProfilePicture');

  return (
    <section
      aria-label={t('profileHeader.label')}
      data-testid="profile-identity-header"
      className="relative pb-14 sm:pb-18"
    >
      <div
        className="group border-border relative aspect-[5/2] max-h-60 w-full overflow-hidden rounded-xl border sm:aspect-[4/1]"
        data-testid="profile-identity-backdrop"
      >
        {backdropUrl ? (
          <MediaArtwork
            src={backdropUrl}
            alt={t('studioStringsBatch37.currentProfileBackdrop')}
            seed={`${profile.username}-backdrop`}
          />
        ) : (
          <MediaArtwork
            placeholder={
              <span className="text-foreground-secondary flex flex-col items-center gap-1 text-sm">
                <ImageIcon size={28} aria-hidden />
                {t('profileBackdropSectionStates.addABackdrop')}
              </span>
            }
          />
        )}
        <Tooltip
          content={changeBackdrop}
          side="top"
          wrapperClassName="absolute inset-0"
        >
          <Button
            variant="plain"
            size="flexible"
            type="button"
            aria-label={changeBackdrop}
            data-testid="profile-identity-backdrop-edit"
            onClick={() => setBackdropOpen(true)}
            className="flex size-full items-start justify-end rounded-xl p-3 active:scale-100"
          >
            <span className={editChip}>
              <PencilIcon size={16} aria-hidden />
            </span>
          </Button>
        </Tooltip>
      </div>

      <div
        className="group ring-background bg-background-secondary absolute bottom-0 left-4 z-10 size-28 overflow-hidden rounded-full ring-4 sm:left-6 sm:size-36"
        data-testid="profile-identity-avatar"
      >
        <MediaArtwork
          src={hero.imageUrl}
          alt={profile.displayName || profile.username}
          seed={profile.username}
          imageReveal={false}
          fallbackBackground={hero.imageFallback}
          placeholder={
            hero.imageFallback ? (
              <span className="text-3xl font-bold text-white">
                {(profile.displayName || profile.username)
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            ) : undefined
          }
        />
        <Tooltip
          content={changeAvatar}
          side="bottom"
          wrapperClassName="absolute inset-0"
        >
          <Button
            variant="plain"
            size="flexible"
            type="button"
            aria-label={changeAvatar}
            data-testid="profile-identity-avatar-edit"
            onClick={() => setAvatarOpen(true)}
            className="flex size-full items-end justify-end rounded-full p-2 active:scale-100 sm:p-3"
          >
            <span className={editChip}>
              <PencilIcon size={16} aria-hidden />
            </span>
          </Button>
        </Tooltip>
      </div>

      <ProfileBackdropDialog
        isOpen={backdropOpen}
        onClose={() => setBackdropOpen(false)}
        backdropUrl={backdropUrl}
        onChange={(next) =>
          setProfile((current) =>
            current ? { ...current, backdropUrl: next } : current,
          )
        }
      />
      <ProfilePictureDialog
        isOpen={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        avatarUrl={avatarUrl}
        avatarTheme={profile.avatarTheme}
        onAvatarChange={handleAvatarChange}
        onAvatarThemeChange={(avatarTheme) =>
          setProfile((current) =>
            current ? { ...current, avatarTheme } : current,
          )
        }
        onRemove={removeAvatar}
      />
    </section>
  );
}
