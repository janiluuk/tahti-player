import { ImageReveal } from '@tahti-player/ui';

import { type PressKitImageItem } from '../../../api/artist-settings';

export function PressKitPreview({
  displayName,
  bio,
  images,
}: {
  displayName: string;
  bio: string | null;
  images: PressKitImageItem[];
}) {
  return (
    <div className="border-border bg-background overflow-hidden rounded-xl border shadow-lg">
      <div className="via-primary/30 relative min-h-48 overflow-hidden bg-gradient-to-br from-black/80 to-black/80 p-5 text-white sm:min-h-56">
        {images[0] ? (
          <ImageReveal
            src={images[0].imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full opacity-65"
            imgClassName="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <h3 className="font-display relative mt-24 text-2xl font-extrabold tracking-tight sm:mt-32">
          {displayName}
        </h3>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <p
          className={`text-sm leading-relaxed ${bio ? 'text-foreground' : 'text-foreground-secondary italic'}`}
        >
          {bio || 'No bio yet.'}
        </p>
        {images.length > 1 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.slice(1, 5).map((image) => (
              <ImageReveal
                key={image.id}
                src={image.imageUrl}
                alt={image.title ?? ''}
                className="aspect-square w-full rounded-md"
                imgClassName="object-cover"
              />
            ))}
          </div>
        ) : null}
        {images.length === 0 ? (
          <p className="text-foreground-secondary text-xs">
            Add at least one included image to complete the preview.
          </p>
        ) : null}
      </div>
    </div>
  );
}
