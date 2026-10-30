import { type FC, type ReactNode } from 'react';

import { cn } from '../../utils';
import { ImageReveal } from '../ImageReveal';

export type StoryCardProps = {
  /** Wide image shown when `media` is not given. */
  imageSrc?: string | null;
  /** Replaces the image, e.g. artwork with a play control. Rendered in the
   * same 16:9 frame. */
  media?: ReactNode;
  /** Muted line above the title, e.g. `News · 1 day ago`. */
  meta: ReactNode;
  /** The title; pass a link element to make it navigable. */
  title: ReactNode;
  excerpt?: ReactNode;
  authorName: string;
  authorAvatarSrc?: string | null;
  /** Wraps the author row, e.g. in a profile link. */
  renderAuthor?: (row: ReactNode) => ReactNode;
  className?: string;
  'data-testid'?: string;
};

/** Editorial card: wide image, meta line, bold title, excerpt and author.
 * No frame, so a row of them reads like a magazine strip. */
export const StoryCard: FC<StoryCardProps> = ({
  imageSrc,
  media,
  meta,
  title,
  excerpt,
  authorName,
  authorAvatarSrc,
  renderAuthor,
  className,
  'data-testid': testId = 'story-card',
}) => {
  const initial = authorName.trim().charAt(0).toUpperCase();
  const authorRow = (
    <span className="text-foreground-secondary flex min-w-0 items-center gap-2 text-sm">
      <ImageReveal
        src={authorAvatarSrc ?? undefined}
        alt=""
        className="bg-background-secondary size-6 shrink-0 rounded-full"
        placeholder={
          <span className="text-foreground-secondary text-[10px] font-bold">
            {initial}
          </span>
        }
      />
      <span className="truncate">{authorName}</span>
    </span>
  );

  return (
    <article
      data-testid={testId}
      className={cn('flex min-w-0 flex-col gap-3', className)}
    >
      <div className="bg-background-secondary relative aspect-video w-full overflow-hidden rounded-xl">
        {media ?? (
          <ImageReveal
            src={imageSrc ?? undefined}
            alt=""
            className="size-full"
            imgClassName="object-cover"
            placeholder={
              <span
                className="from-primary/40 to-accent-purple/40 flex size-full items-center justify-center bg-gradient-to-br text-4xl font-bold text-white/80"
                aria-hidden
              >
                {initial}
              </span>
            }
          />
        )}
      </div>
      <p className="text-foreground-secondary text-sm">{meta}</p>
      <h3 className="line-clamp-3 text-lg leading-snug font-bold">{title}</h3>
      {excerpt ? (
        <p className="text-foreground-secondary line-clamp-3 text-sm leading-relaxed">
          {excerpt}
        </p>
      ) : null}
      {renderAuthor ? renderAuthor(authorRow) : authorRow}
    </article>
  );
};
