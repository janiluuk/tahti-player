import { LinkIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilePicker,
  ImageReveal,
  Input,
  Tooltip,
} from '@tahti-player/ui';

import { youtubeEmbedUrl } from '../../api/channel-design';
import { Eyebrow } from '../tahti/Eyebrow';

type Props = {
  disabled?: boolean;
  pendingFile: File | null;
  url: string;
  urlOpen: boolean;
  onUrlOpenChange: (open: boolean) => void;
  onUrlChange: (url: string) => void;
  onFiles: (files: readonly File[]) => void;
  /**
   * `compact` — Player → Video / image tab (picker + URL only).
   * `backdrop` — Header video style (eyebrow, preview, remove).
   */
  variant?: 'compact' | 'backdrop';
  /** Object URL or remote URL for local preview (backdrop). */
  previewUrl?: string | null;
  isImage?: boolean;
  onRemove?: () => void;
};

/** Shared MP4/WebM/image picker + optional URL field for header / player media. */
export function VideoOrImageField({
  disabled = false,
  pendingFile,
  url,
  urlOpen,
  onUrlOpenChange,
  onUrlChange,
  onFiles,
  variant = 'compact',
  previewUrl = null,
  isImage = false,
  onRemove,
}: Props) {
  const { t } = useTranslation('web');
  const urlToggle = (
    <Tooltip content={t('videoOrImage.showUrlField')} side="top">
      <Button
        size="icon-sm"
        variant="text"
        aria-label={t('videoOrImage.showUrlField')}
        aria-pressed={urlOpen}
        onClick={() => onUrlOpenChange(!urlOpen)}
      >
        <LinkIcon size={15} aria-hidden />
      </Button>
    </Tooltip>
  );

  const urlInput = urlOpen ? (
    <Input
      inputMode="url"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      label={t('videoOrImage.youtubeVideoOrImageUrl')}
      value={url}
      placeholder="https://youtube.com/watch?v=… or https://…/backdrop.jpg"
      onChange={(event) => onUrlChange(event.target.value)}
    />
  ) : null;

  const picker = (
    <div className="relative">
      <FilePicker
        accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled}
        selectedFiles={pendingFile ? [pendingFile] : []}
        labels={{
          title: t('videoOrImageFieldFields.chooseAVideoOrImage'),
          description: t('videoOrImageFieldFields.mp4WebmJpegPngWebp'),
          browse: 'Browse files',
        }}
        onFiles={onFiles}
      />
      <div className="absolute top-2 right-2">{urlToggle}</div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="channel-video-image-field"
      >
        {picker}
        {urlInput}
      </div>
    );
  }

  const displaySrc = previewUrl ?? url;
  const showPreview = Boolean(previewUrl || url);

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="channel-video-image-field"
    >
      <div>
        <Eyebrow>{t('videoOrImage.videoOrImageBackdrop')}</Eyebrow>
        <p className="text-foreground-secondary mt-1 text-xs">
          {t('videoOrImage.uploadAnMp4WebmVideo')}
        </p>
      </div>
      {picker}
      {urlInput}
      {showPreview ? (
        <div className="border-border bg-background relative overflow-hidden rounded-lg border">
          {youtubeEmbedUrl(url) && !previewUrl ? (
            <iframe
              title={t('videoOrImage.youtubeBackdropPreview')}
              src={youtubeEmbedUrl(url) ?? undefined}
              className="pointer-events-none aspect-video w-full"
              allow="autoplay; encrypted-media"
            />
          ) : isImage ? (
            <ImageReveal
              src={displaySrc}
              alt=""
              className="aspect-video w-full"
              imgClassName="object-cover"
            />
          ) : (
            <video
              src={displaySrc}
              muted
              loop
              autoPlay
              playsInline
              controls
              className="aspect-video w-full object-cover"
            />
          )}
        </div>
      ) : null}
      {(pendingFile || url) && onRemove ? (
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={onRemove}
        >
          {t('videoOrImage.removeBackdrop')}
        </Button>
      ) : null}
    </div>
  );
}
