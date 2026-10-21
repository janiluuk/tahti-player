import { Button, ImageReveal } from '@tahti-player/ui';

import { PostLink } from '../../../components/PostLink';

export function PostPreview({
  title,
  body,
  publishAt,
  linkUrl,
  linkLabel,
  images,
  onImageClick,
}: {
  title: string | null;
  body: string;
  publishAt?: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  images: string[];
  onImageClick?: (index: number) => void;
}) {
  return (
    <article className="flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold">{title || 'Untitled'}</h3>
        {publishAt && (
          <p className="text-foreground-secondary mt-1 text-xs">
            {new Date(publishAt).toLocaleString()}
          </p>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{body}</p>
      <PostLink
        linkUrl={linkUrl}
        linkLabel={linkLabel}
        className="self-start text-sm"
      />
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image, index) => (
            <Button
              key={`${image}-${index}`}
              type="button"
              variant="text"
              className="bg-background-secondary aspect-video h-auto overflow-hidden rounded-lg p-0"
              onClick={() => onImageClick?.(index)}
              aria-label={`View image ${index + 1} full size`}
            >
              <ImageReveal src={image} alt="" className="size-full" />
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
