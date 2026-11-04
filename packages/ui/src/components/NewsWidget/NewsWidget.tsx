import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
import { FC, useRef, type ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ImageReveal } from '../ImageReveal';
import { Tooltip } from '../Tooltip';
import { ArticleCard, type ArticleCardItem } from './ArticleCard';

const SCROLL_INCREMENT = 320;

export type NewsWidgetLabels = {
  nothingFound: string;
};

export type NewsWidgetProps = {
  title: string;
  badge?: string;
  /** Optional mark next to the title (feed logo / configured thumbnail). */
  thumbnailUrl?: string;
  items: ArticleCardItem[];
  labels: NewsWidgetLabels;
  /** e.g. Show all news — shown before the scroll arrows. */
  more?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/** Widescreen sibling of `CardsRow`, sized for articles/news: thumbnail +
 * header + teaser text need more width per item than the standard
 * thumbnail-sized cards other widgets use. Same row/slider shell as the
 * other widgets — just a wider card. */
export const NewsWidget: FC<NewsWidgetProps> = ({
  title,
  badge,
  thumbnailUrl,
  items,
  labels,
  more,
  className,
  'data-testid': testId = 'news-widget',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollContainerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div data-testid={testId} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {thumbnailUrl ? (
            <ImageReveal
              src={thumbnailUrl}
              alt=""
              className="size-8 shrink-0 overflow-hidden rounded-md"
              placeholder={
                <Newspaper size={16} className="text-foreground opacity-20" />
              }
            />
          ) : null}
          <h2 className="text-foreground text-lg font-bold">{title}</h2>
          {badge && (
            <Badge
              data-testid="news-widget-badge"
              variant="pill"
              color="purple"
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {more}
          <Tooltip content="Scroll left" side="top">
            <Button
              data-testid="news-widget-scroll-left"
              size="icon"
              onClick={() => scrollBy(-SCROLL_INCREMENT)}
              variant="noShadow"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Scroll right" side="top">
            <Button
              data-testid="news-widget-scroll-right"
              size="icon"
              onClick={() => scrollBy(SCROLL_INCREMENT)}
              variant="noShadow"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-visible [scroll-behavior:smooth] pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.length === 0 ? (
          <div
            data-testid="news-widget-nothing-found"
            className="text-foreground-secondary py-8 text-sm"
          >
            {labels.nothingFound}
          </div>
        ) : (
          items.map((item) => <ArticleCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
};
