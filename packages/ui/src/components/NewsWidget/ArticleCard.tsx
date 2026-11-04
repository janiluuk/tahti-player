import { FC } from 'react';

import { cn } from '../../utils';
import { StoryCard, type StoryCardKindColor } from '../StoryCard';

export type ArticleCardItem = {
  id: string;
  title: string;
  teaser?: string;
  imageUrl?: string;
  onClick?: () => void;
  publishedAt?: string;
  publishedLabel?: string;
  /** Color pill on the image, e.g. `News` or the feed's name. */
  kind?: string;
  kindColor?: StoryCardKindColor;
};

type ArticleCardProps = {
  item: ArticleCardItem;
  className?: string;
};

/** A news or RSS item in a row: the shared `StoryCard` overlay design at a
 * fixed row width. */
export const ArticleCard: FC<ArticleCardProps> = ({ item, className }) => (
  <StoryCard
    data-testid="article-card"
    className={cn('w-72 shrink-0 sm:w-80', className)}
    imageSrc={item.imageUrl}
    kind={item.kind}
    kindColor={item.kindColor}
    date={item.publishedLabel}
    dateTime={item.publishedAt}
    title={<span data-testid="article-card-title">{item.title}</span>}
    excerpt={
      item.teaser ? (
        <span data-testid="article-card-teaser">{item.teaser}</span>
      ) : undefined
    }
    onOpen={item.onClick}
    openLabel={`Read ${item.title}`}
  />
);
