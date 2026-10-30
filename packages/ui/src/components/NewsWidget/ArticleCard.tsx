import { CalendarDaysIcon, Newspaper } from 'lucide-react';
import { FC } from 'react';

import { cn } from '../../utils';
import { Box } from '../Box';
import { ImageReveal } from '../ImageReveal';

export type ArticleCardItem = {
  id: string;
  title: string;
  teaser?: string;
  imageUrl?: string;
  onClick?: () => void;
  publishedAt?: string;
  publishedLabel?: string;
};

type ArticleCardProps = {
  item: ArticleCardItem;
  className?: string;
};

/** Wider variant of the standard row card — articles/news need more room
 * per item than the thumbnail-sized `Card` used for tracks/releases. */
export const ArticleCard: FC<ArticleCardProps> = ({ item, className }) => {
  return (
    <Box
      data-testid="article-card"
      variant="tertiary"
      className={cn(
        'flex w-72 shrink-0 flex-col overflow-hidden p-0 sm:w-80',
        item.onClick && 'cursor-pointer',
        className,
      )}
      onClick={item.onClick}
      onKeyDown={
        item.onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                item.onClick?.();
              }
            }
          : undefined
      }
      role={item.onClick ? 'button' : undefined}
      tabIndex={item.onClick ? 0 : undefined}
    >
      <ImageReveal
        src={item.imageUrl}
        alt=""
        className="bg-background aspect-video w-full"
        placeholder={
          <Newspaper size={32} className="text-foreground opacity-20" />
        }
      />
      <div className="flex flex-col gap-1 p-3">
        <h3
          data-testid="article-card-title"
          className="text-foreground line-clamp-2 text-sm font-bold"
        >
          {item.title}
        </h3>
        {item.publishedAt && item.publishedLabel ? (
          <span className="text-foreground-secondary flex items-center gap-1.5 text-xs">
            <CalendarDaysIcon size={13} aria-hidden />
            <time
              dateTime={item.publishedAt}
              title={new Date(item.publishedAt).toLocaleString()}
            >
              {item.publishedLabel}
            </time>
          </span>
        ) : null}
        {item.teaser && (
          <p
            data-testid="article-card-teaser"
            className="text-foreground-secondary line-clamp-2 text-xs"
          >
            {item.teaser}
          </p>
        )}
      </div>
    </Box>
  );
};
