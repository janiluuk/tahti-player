import { ImageReveal } from '@tahti-player/ui';

export function PostPreview({
  title,
  body,
  publishAt,
  images,
  onImageClick,
}: {
  title: string | null;
  body: string;
  publishAt?: string;
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
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className="bg-background-secondary aspect-video overflow-hidden rounded-lg"
              onClick={() => onImageClick?.(index)}
              aria-label={`View image ${index + 1} full size`}
            >
              <ImageReveal src={image} alt="" className="size-full" />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
