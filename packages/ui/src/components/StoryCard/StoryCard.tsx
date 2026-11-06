import type { VariantProps } from 'class-variance-authority';
import { ClockIcon } from 'lucide-react';
import { type FC, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge, badgeVariants } from '../Badge';
import { Button } from '../Button';
import { ImageReveal } from '../ImageReveal';
import { MediaArtwork } from '../MediaArtwork';

export type StoryCardKindColor = NonNullable<
  VariantProps<typeof badgeVariants>['color']
>;

export type StoryCardProps = {
  /** Wide image shown when `media` is not given. */
  imageSrc?: string | null;
  /** Stable id (story id, username) that picks the default artwork when
   * there is no image; falls back to `authorName`. */
  artworkSeed?: string;
  /** Replaces the image, e.g. artwork with a play control. Rendered in the
   * same 16:9 frame. */
  media?: ReactNode;
  /** Activity type shown as a color pill on the image, e.g. `News`. */
  kind?: string;
  /** Pill colour for `kind`. Defaults to yellow so it reads on dark overlays. */
  kindColor?: StoryCardKindColor;
  /** Formatted date on the image, e.g. `14 hours ago`; shown with a clock. */
  date?: string;
  /** Machine-readable date for the `<time>` element. */
  dateTime?: string;
  /** Free-form muted line above the title. Used when `kind` / `date` are not
   * set (legacy callers). */
  meta?: ReactNode;
  /** The title; pass a link element to make it navigable. */
  title: ReactNode;
  excerpt?: ReactNode;
  /** Who posted it; left out for platform news and RSS items. */
  authorName?: string;
  authorAvatarSrc?: string | null;
  /** Wraps the author row, e.g. in a profile link. */
  renderAuthor?: (row: ReactNode) => ReactNode;
  /** Makes the image open the story (e.g. in a dialog); pass the same
   * handler to a title button. */
  onOpen?: () => void;
  /** Accessible name of the image button, e.g. `Read “Title”`. */
  openLabel?: string;
  /** Position in a row; staggers the entrance so cards arrive in turn. */
  index?: number;
  className?: string;
  'data-testid'?: string;
};

const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;

/** The one card for stories, news and feed items: a 16:9 image with the kind
 * pill, date, title and teaser overlaid on a gradient, then the author below. */
export const StoryCard: FC<StoryCardProps> = ({
  imageSrc,
  artworkSeed,
  media,
  kind,
  kindColor = 'yellow',
  date,
  dateTime,
  meta,
  title,
  excerpt,
  authorName = '',
  authorAvatarSrc,
  renderAuthor,
  onOpen,
  openLabel = 'Read story',
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

  return (
    <article
      data-testid={testId}
      className={cn(
        'group flex min-w-0 flex-col gap-2',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500',
        className,
      )}
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`,
      }}
    >
      <div className="bg-background-secondary relative aspect-video w-full overflow-hidden rounded-xl">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          {media ?? (
            <MediaArtwork
              size="fill"
              src={imageSrc ?? undefined}
              alt=""
              seed={artworkSeed || authorName}
            />
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        />
        {onOpen && !media ? (
          <Button
            variant="text"
            size="flexible"
            aria-label={openLabel}
            data-testid="story-card-open"
            className="focus-visible:ring-primary absolute inset-0 size-full rounded-xl p-0 hover:bg-transparent focus-visible:ring-2 active:scale-100"
            onClick={onOpen}
          />
        ) : null}
        {kind ? (
          <div className="pointer-events-none absolute top-0 left-0 z-10 p-3 sm:p-4">
            <Badge
              variant="pill"
              color={kindColor}
              data-testid="story-card-kind"
            >
              {kind}
            </Badge>
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-3 sm:gap-2 sm:p-4 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          {date ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white/85">
              <ClockIcon size={12} aria-hidden />
              <time dateTime={dateTime}>{date}</time>
            </span>
          ) : null}
          {!kind && !date && meta ? (
            <p className="text-sm text-white/85">{meta}</p>
          ) : null}
          <h3 className="line-clamp-2 text-base leading-snug font-bold text-white sm:text-lg">
            {title}
          </h3>
          {excerpt ? (
            <p
              data-testid="story-card-excerpt"
              className="line-clamp-2 text-sm leading-relaxed text-white/80"
            >
              {excerpt}
            </p>
          ) : null}
        </div>
      </div>
      {authorName ? (renderAuthor ? renderAuthor(authorRow) : authorRow) : null}
    </article>
  );
};
