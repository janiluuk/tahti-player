import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.success('Profile picture saved.');
    }
    return saved;
  };
  return (
    <StudioPanel
      title="Profile picture"
      description="Use a clear square portrait or mark. Click the picture to upload one, pick from your gallery or paste an image link."
    >
      <div className="flex flex-wrap items-center gap-5">
        <RoundImageUploadButton
          label="Profile picture"
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
                JPEG, PNG, WebP, or GIF. An animated GIF shows its first frame
                and plays when someone hovers it. The original is kept for
                full-size use.
              </p>
            }
          >
            <span
              tabIndex={0}
              role="img"
              aria-label="Accepted image formats"
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
          The avatar colour shows only when there is no profile picture.
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
