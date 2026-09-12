import isEmpty from 'lodash-es/isEmpty';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
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
};

export type CardsRowProps<T extends CardsRowItem = CardsRowItem> = {
  title: string;
  badge?: string;
  items: T[];
  labels: CardsRowLabels;
  className?: string;
  'data-testid'?: string;
  /** Custom card renderer, for callers whose items carry richer content
   * than the default title/subtitle/imageUrl Card can show. Filtering
   * (by `.title`) and scrolling still work the same either way. */
  renderItem?: (item: T) => ReactNode;
};

export const CardsRow = <T extends CardsRowItem = CardsRowItem>({
  title,
  badge,
  items,
  labels,
  className,
  'data-testid': testId = 'cards-row',
  renderItem,
}: CardsRowProps<T>) => {
  const {
    filterText,
    setFilterText,
    clearFilter,
    filteredItems,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
  } = useCardsRow(items);

  return (
    <div data-testid={testId} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-lg font-bold">{title}</h2>
          {badge && (
            <Badge data-testid="cards-row-badge" variant="pill" color="purple">
              {badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            data-testid="cards-row-filter"
            size="sm"
            tone="secondary"
            placeholder={labels.filterPlaceholder}
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
          <div
            data-testid="cards-row-nothing-found"
            className="text-foreground-secondary py-8 text-sm"
          >
            {labels.nothingFound}
          </div>
        ) : (
          filteredItems.map((item) =>
            renderItem ? (
              <div key={item.id} className="flex-shrink-0">
                {renderItem(item)}
              </div>
            ) : (
              <Card
                key={item.id}
                className="flex-shrink-0"
                src={item.imageUrl}
                title={item.title}
                subtitle={item.subtitle}
                onClick={item.onClick}
              />
            ),
          )
        )}
      </div>
    </div>
  );
};
