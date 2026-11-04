import { ChevronLeftIcon, ChevronRightIcon, Newspaper } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { ImageReveal } from '../ImageReveal';

export type NewsCarouselItem = {
  id: string;
  title: string;
  imageUrl?: string;
  /** Feed or site name shown under the picture, e.g. `DJ Mag`. */
  source: string;
  /** CSS colour of the dot before the source; one per feed. */
  sourceColor?: string;
  publishedAt?: string;
  /** Short date, e.g. `5 hours ago` or `Oct 30, 2026`. */
  publishedLabel?: string;
  /** Tooltip with the full local timestamp; defaults to the browser locale. */
  publishedTitle?: string;
  onClick?: () => void;
};

export type NewsCarouselProps = {
  title?: string;
  items: NewsCarouselItem[];
  /** "more News" link or button, shown before the arrows. */
  more?: ReactNode;
  /** Extra header controls, e.g. a Sources button. */
  actions?: ReactNode;
  labels?: {
    previous?: string;
    next?: string;
    empty?: string;
  };
  className?: string;
};

const SCROLL_EDGE = 4;

/** Latest headlines from one or more sources in a row of picture cards
 * with previous / next arrows. */
export const NewsCarousel: FC<NewsCarouselProps> = ({
  title = 'Latest News',
  items,
  more,
  actions,
  labels,
  className,
}) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setAtStart(track.scrollLeft <= SCROLL_EDGE);
    setAtEnd(
      track.scrollLeft + track.clientWidth >= track.scrollWidth - SCROLL_EDGE,
    );
  }, []);

  useEffect(() => {
    updateEdges();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length, updateEdges]);

  const scrollPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <section
      data-testid="news-carousel"
      aria-label={title}
      className={cn('@container flex min-w-0 flex-col gap-4', className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          {more}
          <Button
            size="icon-sm"
            variant="secondary"
            className="rounded-full"
            aria-label={labels?.previous ?? 'Previous news'}
            disabled={atStart}
            onClick={() => scrollPage(-1)}
            data-testid="news-carousel-previous"
          >
            <ChevronLeftIcon size={16} aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            className="rounded-full"
            aria-label={labels?.next ?? 'Next news'}
            disabled={atEnd}
            onClick={() => scrollPage(1)}
            data-testid="news-carousel-next"
          >
            <ChevronRightIcon size={16} aria-hidden />
          </Button>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {labels?.empty ?? 'No news right now.'}
        </p>
      ) : (
        <ul
          ref={trackRef}
          onScroll={updateEdges}
          className="grid snap-x snap-mandatory [scrollbar-width:none] auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto pb-1 @lg:auto-cols-[calc((100%-1rem)/2)] @3xl:auto-cols-[calc((100%-2rem)/3)] @5xl:auto-cols-[calc((100%-3rem)/4)]"
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="min-w-0 snap-start"
              data-testid="news-carousel-item"
            >
              <NewsCarouselCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const NewsCarouselCard: FC<{ item: NewsCarouselItem }> = ({ item }) => {
  const body = (
    <>
      <ImageReveal
        src={item.imageUrl}
        alt=""
        className="bg-background-secondary aspect-[2/1] w-full overflow-hidden rounded-xl"
        imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        placeholder={
          <Newspaper size={32} className="text-foreground opacity-20" />
        }
      />
      <span className="text-foreground-secondary mt-3 flex min-w-0 items-center gap-1.5 text-xs">
        <span
          aria-hidden
          className="bg-accent-red size-2 shrink-0 rounded-full"
          style={
            item.sourceColor ? { background: item.sourceColor } : undefined
          }
        />
        <span className="truncate font-medium">{item.source}</span>
        {item.publishedLabel ? (
          <>
            <span aria-hidden>·</span>
            <time
              className="shrink-0"
              dateTime={item.publishedAt}
              title={
                item.publishedTitle ??
                (item.publishedAt
                  ? new Date(item.publishedAt).toLocaleString()
                  : undefined)
              }
            >
              {item.publishedLabel}
            </time>
          </>
        ) : null}
      </span>
      <span
        data-testid="news-carousel-title"
        className="text-foreground mt-1 line-clamp-3 text-base leading-snug font-bold group-hover:underline"
      >
        {item.title}
      </span>
    </>
  );

  return item.onClick ? (
    <Button
      variant="plain"
      size="flexible"
      onClick={item.onClick}
      className="group flex w-full flex-col items-stretch text-left whitespace-normal"
    >
      {body}
    </Button>
  ) : (
    <div className="group flex flex-col">{body}</div>
  );
};
