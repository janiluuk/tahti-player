import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import {
  AVATAR_UPLOAD_ACCEPT,
  uploadProfileAvatar,
} from '../../../api/artist-settings';
import { setProfileAvatarFromUrl } from '../../../api/image-from-url';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { CoverArtPickerDialog } from '../../../components/CoverArtPickerDialog';
import { ImageUrlForm } from '../../../components/ImageUrlForm';
import { readAvatarTheme, type AvatarTheme } from '../../../lib/avatarTheme';
import { AvatarThemePicker } from './AvatarThemePicker';

const uploadAvatar = (file: File) =>
  uploadProfileAvatar(file).then((r) =>
    r.ok ? { ok: true as const, data: { url: r.avatarUrl } } : r,
  );

/** Profile picture picker: upload, pick from presets or the artist's own
 * images, paste an image link, remove the picture, and (with no picture)
 * choose the avatar colour drawn in its place. */
export function ProfilePictureDialog({
  isOpen,
  onClose,
  avatarUrl,
  avatarTheme,
  onAvatarChange,
  onAvatarThemeChange,
  onRemove,
}: {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  avatarTheme: unknown;
  onAvatarChange: (url: string) => void;
  onAvatarThemeChange: (theme: AvatarTheme | null) => void;
  onRemove: () => Promise<boolean>;
}) {
  const { t } = useTranslation('web');
  const [fetching, setFetching] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const storeImageUrl = async (sourceUrl: string) => {
    setFetching(true);
    const result = await setProfileAvatarFromUrl(sourceUrl);
    setFetching(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    onAvatarChange(result.url);
    return true;
  };

  return (
    <>
      <CoverArtPickerDialog
        isOpen={isOpen}
        onClose={onClose}
        label={t('profilePicture.profilePicture')}
        value={avatarUrl}
        upload={uploadAvatar}
        accept={AVATAR_UPLOAD_ACCEPT}
        onSelect={(url, source) =>
          source === 'gallery' ? storeImageUrl(url) : onAvatarChange(url)
        }
        extra={
          <div className="border-border flex flex-col gap-4 border-t pt-4">
            <p className="text-foreground-secondary text-xs">
              {t('profilePicture.jpegPngWebpOrGif')}
            </p>
            <ImageUrlForm
              busy={fetching}
              onSubmit={async (url) => {
                const saved = await storeImageUrl(url);
                if (saved) {
                  toast.success(i18n.t('web:toasts.profilePictureSaved'));
                  onClose();
                }
                return saved;
              }}
            />
            {avatarUrl ? (
              <>
                <p
                  className="text-foreground-secondary text-xs"
                  data-testid="avatar-theme-hint"
                >
                  {t('profilePicture.theAvatarColourShowsOnly')}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    onClose();
                    setConfirmRemove(true);
                  }}
                >
                  {t('profileHeader.removeProfilePicture')}
                </Button>
              </>
            ) : (
              <AvatarThemePicker
                value={readAvatarTheme(avatarTheme)}
                onChange={onAvatarThemeChange}
              />
            )}
          </div>
        }
      />
      <ConfirmDialog
        destructive
        isOpen={confirmRemove}
        title={t('profileHeader.removeProfilePicture')}
        description={t('profileHeader.removeProfilePictureDescription')}
        confirmLabel={t('profileHeader.remove')}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          if (removing) {
            return;
          }
          setRemoving(true);
          void onRemove().finally(() => {
            setRemoving(false);
            setConfirmRemove(false);
          });
        }}
      />
    </>
  );
}
