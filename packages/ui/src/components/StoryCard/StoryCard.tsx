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
  /** Position in a row; staggers the entrance so cards arrive in turn. */
  index?: number;
  className?: string;
  'data-testid'?: string;
};

const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;

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
  index = 0,
  className,
  'data-testid': testId = 'story-card',
}) => {
  const avatarSrc = authorAvatarSrc ?? undefined;
  const initial = authorName.trim().charAt(0).toUpperCase();
  const authorRow = (
    <span className="text-foreground-secondary flex min-w-0 items-center gap-2 text-sm">
      <ImageReveal
        src={avatarSrc}
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

  const imageFallback = avatarSrc ? (
    <span
      className="relative flex size-full items-center justify-center"
      data-testid="story-card-avatar-cover"
      aria-hidden
    >
      <img
        src={avatarSrc}
        alt=""
        className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl"
      />
      <span className="from-background/10 to-background/50 absolute inset-0 bg-gradient-to-b" />
      <img
        src={avatarSrc}
        alt=""
        className="relative size-24 rounded-full object-cover shadow-lg ring-2 ring-white/20"
      />
    </span>
  ) : (
    <span
      className="from-primary/40 to-accent-purple/40 flex size-full items-center justify-center bg-gradient-to-br text-4xl font-bold text-white/80"
      aria-hidden
    >
      {initial}
    </span>
  );

  return (
    <article
      data-testid={testId}
      className={cn(
        'group flex min-w-0 flex-col gap-3',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500',
        className,
      )}
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`,
      }}
    >
      <div className="bg-background-secondary relative aspect-video w-full overflow-hidden rounded-xl">
        <div className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          {media ?? (
            <ImageReveal
              src={imageSrc ?? undefined}
              alt=""
              className="size-full"
              imgClassName="object-cover"
              placeholder={imageFallback}
            />
          )}
        </div>
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
