import isEmpty from 'lodash-es/isEmpty';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { Input } from '../Input';
import { Tooltip } from '../Tooltip';
import { useCardsRow } from './useCardsRow';

export type CardsRowItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onClick?: () => void;
};

export type CardsRowLabels = {
  filterPlaceholder: string;
  nothingFound: string;
  clearFilter?: string;
};

export type CardsRowBadgeColor =
  | 'green'
  | 'cyan'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'blue'
  | 'secondary'
  | 'inverted';

export type CardsRowProps<T extends CardsRowItem = CardsRowItem> = {
  title: string;
  badge?: string;
  /** Section-meaning hue for the title pill (live / radio / history…). */
  badgeColor?: CardsRowBadgeColor;
  items: T[];
  labels: CardsRowLabels;
  className?: string;
  'data-testid'?: string;
  renderItem?: (item: T) => ReactNode;
  cardSurface?: 'brand' | 'neutral';
};

export const CardsRow = <T extends CardsRowItem = CardsRowItem>({
  title,
  badge,
  badgeColor = 'purple',
  items,
  labels,
  className,
  'data-testid': testId = 'cards-row',
  renderItem,
  cardSurface = 'brand',
}: CardsRowProps<T>) => {
  const {
    filterText,
    setFilterText,
    clearFilter,
    filteredItems,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
    showControls,
  } = useCardsRow(items);

  return (
    <div data-testid={testId} className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-lg font-bold whitespace-nowrap">
            {title}
          </h2>
          {badge && (
            <Badge
              data-testid="cards-row-badge"
              variant="pill"
              color={badgeColor}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div
          data-testid="cards-row-controls"
          className={cn(
            'min-w-64 flex-1 items-center justify-end gap-2',
            showControls ? 'flex' : 'hidden',
          )}
        >
          <Input
            data-testid="cards-row-filter"
            size="sm"
            tone="secondary"
            placeholder={labels.filterPlaceholder}
            aria-label={labels.filterPlaceholder.replace(/(…|\.{3})$/, '')}
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            endAddon={
              <Tooltip content="Clear filter" side="top">
                <button
                  data-testid="cards-row-clear-filter"
                  type="button"
                  className="text-foreground cursor-pointer"
                  onClick={clearFilter}
                  aria-label="Clear filter"
                >
                  <Filter size={14} />
                </button>
              </Tooltip>
            }
          />
          <div className="flex items-center gap-2">
            <Tooltip content="Scroll left" side="top">
              <Button
                data-testid="cards-row-scroll-left"
                size="icon"
                onClick={scrollLeft}
                variant="noShadow"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </Button>
            </Tooltip>
            <Tooltip content="Scroll right" side="top">
              <Button
                data-testid="cards-row-scroll-right"
                size="icon"
                onClick={scrollRight}
                variant="noShadow"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-visible [scroll-behavior:smooth] pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isEmpty(filteredItems) ? (
          <EmptyState
            data-testid="cards-row-nothing-found"
            size="sm"
            title={labels.nothingFound}
            className="w-full py-8"
            action={
              filterText ? (
                <Button
                  data-testid="cards-row-nothing-found-clear"
                  size="sm"
                  variant="secondary"
                  onClick={clearFilter}
                >
                  {labels.clearFilter ?? 'Clear filter'}
                </Button>
              ) : undefined
            }
          />
        ) : (
          filteredItems.map((item) =>
            renderItem ? (
              <div
                key={item.id}
                className="flex-shrink-0 [contain-intrinsic-size:auto_12rem] [content-visibility:auto]"
              >
                {renderItem(item)}
              </div>
            ) : (
              <Card
                key={item.id}
                className="flex-shrink-0 [contain-intrinsic-size:auto_12rem] [content-visibility:auto]"
                src={item.imageUrl}
                title={item.title}
                subtitle={item.subtitle}
                onClick={item.onClick}
                surface={cardSurface}
              />
            ),
          )
        )}
      </div>
    </div>
  );
};
