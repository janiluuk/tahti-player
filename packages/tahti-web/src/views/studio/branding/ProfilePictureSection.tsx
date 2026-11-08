import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Tooltip } from '@tahti-player/ui';

import {
  AVATAR_UPLOAD_ACCEPT,
  uploadProfileAvatar,
} from '../../../api/artist-settings';
import { setProfileAvatarFromUrl } from '../../../api/image-from-url';
import { ImageUrlForm } from '../../../components/ImageUrlForm';
import { RoundImageUploadButton } from '../../../components/RoundImageUploadButton';
import { StudioPanel } from '../../../components/StudioPanel';
import { readAvatarTheme } from '../../../lib/avatarTheme';
import { AvatarThemePicker } from './AvatarThemePicker';
import type { PressKitState } from './usePressKit';

export function ProfilePictureSection({ kit }: { kit: PressKitState }) {
  const { t } = useTranslation('web');
  const { avatarUrl, handleAvatarChange, profile, setProfile } = kit;
  const [fetching, setFetching] = useState(false);

  const storeImageUrl = async (sourceUrl: string) => {
    setFetching(true);
    const result = await setProfileAvatarFromUrl(sourceUrl);
    setFetching(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    handleAvatarChange(result.url);
    return true;
  };

  const saveImageUrl = async (sourceUrl: string) => {
    const saved = await storeImageUrl(sourceUrl);
    if (saved) {
      toast.success(i18n.t('web:toasts.profilePictureSaved'));
    }
    return saved;
  };
  return (
    <StudioPanel
      title={t('profilePicture.profilePicture')}
      description={t('profilePicture.useAClearSquarePortrait')}
    >
      <div className="flex flex-wrap items-center gap-5">
        <RoundImageUploadButton
          label={t('profilePicture.profilePicture')}
          gallery
          onPick={storeImageUrl}
          value={avatarUrl}
          sizeClassName="size-32"
          accept={AVATAR_UPLOAD_ACCEPT}
          upload={(file) =>
            uploadProfileAvatar(file).then((r) =>
              r.ok ? { ok: true as const, data: { url: r.avatarUrl } } : r,
            )
          }
          onChange={handleAvatarChange}
          pickerExtra={(close) => (
            <div className="border-border border-t pt-4">
              <ImageUrlForm
                busy={fetching}
                onSubmit={async (url) => {
                  const saved = await saveImageUrl(url);
                  if (saved) {
                    close();
                  }
                  return saved;
                }}
              />
            </div>
          )}
        />
        <div className="flex flex-col gap-2">
          <Tooltip
            side="bottom"
            content={
              <p className="max-w-64 text-xs leading-relaxed">
                {t('profilePicture.jpegPngWebpOrGif')}
              </p>
            }
          >
            <span
              tabIndex={0}
              role="img"
              aria-label={t('profilePicture.acceptedImageFormats')}
              className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
            >
              <span className="text-[10px] leading-none font-bold">?</span>
            </span>
          </Tooltip>
        </div>
      </div>
      {profile && avatarUrl ? (
        <p
          className="text-foreground-secondary mt-5 text-xs"
          data-testid="avatar-theme-hint"
        >
          {t('profilePicture.theAvatarColourShowsOnly')}
        </p>
      ) : profile ? (
        <div className="mt-5">
          <AvatarThemePicker
            value={readAvatarTheme(profile.avatarTheme)}
            onChange={(avatarTheme) =>
              setProfile((current) =>
                current ? { ...current, avatarTheme } : current,
              )
            }
          />
        </div>
      ) : null}
    </StudioPanel>
  );
}
