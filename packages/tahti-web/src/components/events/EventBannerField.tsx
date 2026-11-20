import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilePicker,
  ImageCropDialog,
  InlineError,
  Loader,
  MediaArtwork,
} from '@tahti-player/ui';

import { uploadUserMediaFile } from '../../api/user-media';
import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../../lib/imageUploadContentType';

export const EVENT_BANNER_ASPECT = 3;
export const EVENT_BANNER_WIDTH = 1800;

function croppedFileName(source: File, type: string): string {
  const base = source.name.replace(/\.[^.]+$/, '') || 'event-banner';
  const ext =
    type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return `${base}-banner.${ext}`;
}

/** Event banner: pick an image, crop it to a wide 3:1 banner, upload it to
 * the viewer's media and hand back its URL. */
export function EventBannerField({
  value,
  onChange,
  seed,
}: {
  value: string;
  onChange: (url: string) => void;
  seed: string;
}) {
  const { t } = useTranslation('web');
  const [pending, setPending] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (source: File, blob: Blob) => {
    setPending(null);
    setError(null);
    setUploading(true);
    const type = blob.type || 'image/jpeg';
    const result = await uploadUserMediaFile(
      new File([blob], croppedFileName(source, type), { type }),
    );
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    onChange(result.data.url);
  };

  return (
    <div className="flex flex-col gap-2" data-testid="event-banner-field">
      <FilePicker
        labels={{
          title: t('eventForm.bannerTitle'),
          description: t('eventForm.bannerDescription'),
          browse: value
            ? t('eventForm.bannerReplace')
            : t('eventForm.bannerChoose'),
        }}
        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
        disabled={uploading}
        onFiles={(files) => {
          const [file] = files;
          if (file) {
            setError(null);
            setPending(file);
          }
        }}
      />
      {uploading ? (
        <p
          role="status"
          className="text-foreground-secondary flex items-center gap-2 text-xs"
        >
          <Loader size="sm" shape="circle" />
          {t('eventForm.bannerUploading')}
        </p>
      ) : null}
      {value ? (
        <div className="flex flex-col items-start gap-2">
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg">
            <MediaArtwork
              src={value}
              alt={t('eventForm.bannerPreview')}
              seed={seed}
              imageReveal={false}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => onChange('')}
          >
            <Trash2Icon size={14} aria-hidden className="mr-1.5" />
            {t('eventForm.bannerRemove')}
          </Button>
        </div>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      {pending ? (
        <ImageCropDialog
          isOpen
          file={pending}
          aspect={EVENT_BANNER_ASPECT}
          outputWidth={EVENT_BANNER_WIDTH}
          labels={{
            title: t('eventForm.cropTitle'),
            description: t('eventForm.cropDescription'),
            zoom: t('eventForm.cropZoom'),
            cancel: t('eventForm.cropCancel'),
            confirm: t('eventForm.cropConfirm'),
          }}
          onCancel={() => setPending(null)}
          onCrop={(blob) => void upload(pending, blob)}
        />
      ) : null}
    </div>
  );
}
