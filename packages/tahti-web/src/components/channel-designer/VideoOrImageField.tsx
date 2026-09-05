import { LinkIcon } from 'lucide-react';

import { Button, FilePicker, Input, Tooltip } from '@tahti-player/ui';

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
  const urlToggle = (
    <Tooltip content="Show URL field" side="top">
      <Button
        size="icon-sm"
        variant="text"
        aria-label="Show URL field"
        aria-pressed={urlOpen}
        onClick={() => onUrlOpenChange(!urlOpen)}
      >
        <LinkIcon size={15} aria-hidden />
      </Button>
    </Tooltip>
  );

  const urlInput = urlOpen ? (
    <Input
      label="YouTube, video, or image URL"
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
          title: 'Choose a video or image',
          description: 'MP4, WebM, JPEG, PNG, WebP, or GIF · maximum 10 MB',
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
        <Eyebrow>Video or image backdrop</Eyebrow>
        <p className="text-foreground-secondary mt-1 text-xs">
          Upload an MP4/WebM video or image, up to 10 MB.
        </p>
      </div>
      {picker}
      {urlInput}
      {showPreview ? (
        <div className="border-border bg-background relative overflow-hidden rounded-lg border">
          {youtubeEmbedUrl(url) && !previewUrl ? (
            <iframe
              title="YouTube backdrop preview"
              src={youtubeEmbedUrl(url) ?? undefined}
              className="pointer-events-none aspect-video w-full"
              allow="autoplay; encrypted-media"
            />
          ) : isImage ? (
            <img
              src={displaySrc}
              alt=""
              className="aspect-video w-full object-cover"
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
          Remove backdrop
        </Button>
      ) : null}
    </div>
  );
}
