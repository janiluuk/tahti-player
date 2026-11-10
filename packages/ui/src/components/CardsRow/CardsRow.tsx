import isEmpty from 'lodash-es/isEmpty';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardLayoutContext } from '../Card';
import { EmptyState } from '../EmptyState';
import { Input } from '../Input';
import { MediaArtwork } from '../MediaArtwork';
import { Tooltip } from '../Tooltip';
import {
  trackRowClass,
  trackRowMinHeightClass,
} from '../TrackTable/utils/rowClass';
import { CardsRowItemMotion } from './CardsRowItemMotion';
import { useCardsRow } from './useCardsRow';

/** Rows with at least this many items get a filter box. The same count
 * applies in every layout and at every width, so a row never gains or loses
 * its filter just because the viewport changed. */
export const CARDS_ROW_FILTER_MIN_ITEMS = 6;

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
  showAsCards?: string;
  showAsList?: string;
  showAsFull?: string;
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

/** `list`: compact rows. `cards`: one horizontally scrolling row of tiles.
 * `full`: tiles as wide as the column, to browse the artwork. */
export type CardsRowLayout = 'list' | 'cards' | 'full';

const LAYOUT_ORDER: readonly CardsRowLayout[] = ['list', 'cards', 'full'];

const MOBILE_QUERY = '(max-width: 767px)';

function ListItemBody({ item }: { item: CardsRowItem }) {
  return (
    <>
      <span className="flex w-16 shrink-0 justify-center">
        <MediaArtwork
          src={item.imageUrl}
          alt=""
          seed={item.id}
          size="md"
          imageReveal={false}
        />
      </span>
      <span className="min-w-0 flex-1 px-2">
        <span
          data-testid="card-title"
          className="text-foreground block truncate"
        >
          {item.title}
        </span>
        {item.subtitle ? (
          <span className="text-foreground-secondary block truncate text-xs">
            {item.subtitle}
          </span>
        ) : null}
      </span>
    </>
  );
}

function usePrefersListOnMobile(): boolean {
  const [prefersList, setPrefersList] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setPrefersList(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return prefersList;
}

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
  /** Shows the filter box beside the scroll buttons once the row has
   * `CARDS_ROW_FILTER_MIN_ITEMS` items. */
  filterable?: boolean;
  /** Controlled cards/list layout. */
  layout?: CardsRowLayout;
  /** Uncontrolled start layout. On phones, list wins unless this or `layout` is set. */
  defaultLayout?: CardsRowLayout;
  onLayoutChange?: (layout: CardsRowLayout) => void;
  /** Toolbar icon that cycles list → cards → full (default on). */
  allowListToggle?: boolean;
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
  filterable = true,
  cardSurface = 'brand',
  layout: layoutProp,
  defaultLayout,
  onLayoutChange,
  allowListToggle = true,
}: CardsRowProps<T>) => {
  const prefersListOnMobile = usePrefersListOnMobile();
  const uncontrolledDefault =
    defaultLayout ?? (prefersListOnMobile ? 'list' : 'cards');
  const [internalLayout, setInternalLayout] =
    useState<CardsRowLayout>(uncontrolledDefault);
  const controlled = layoutProp !== undefined;
  const layout = controlled ? layoutProp : internalLayout;

  useEffect(() => {
    if (controlled || defaultLayout !== undefined) {
      return;
    }
    setInternalLayout(prefersListOnMobile ? 'list' : 'cards');
  }, [controlled, defaultLayout, prefersListOnMobile]);

  const setLayout = (next: CardsRowLayout) => {
    if (!controlled) {
      setInternalLayout(next);
    }
    onLayoutChange?.(next);
  };

  const {
    filterText,
    setFilterText,
    clearFilter,
    filteredItems,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
    overflowing,
    canScrollLeft,
    canScrollRight,
  } = useCardsRow(items);

  const layoutLabels: Record<CardsRowLayout, string> = {
    list: labels.showAsList ?? 'Show as list',
    cards: labels.showAsCards ?? 'Show as cards',
    full: labels.showAsFull ?? 'Show full artwork',
  };
  const layoutIndex = LAYOUT_ORDER.indexOf(layout);
  const smallerLayout = LAYOUT_ORDER[layoutIndex - 1];
  const largerLayout = LAYOUT_ORDER[layoutIndex + 1];
  const isList = layout === 'list';
  const isFull = layout === 'full';
  const showScroll = overflowing && layout === 'cards';
  const showFilter =
    filterable &&
    (items.length >= CARDS_ROW_FILTER_MIN_ITEMS || !isEmpty(filterText.trim()));

  const itemsEmpty = isEmpty(filteredItems);
  const reduceMotion = useReducedMotion();
  const [showEmpty, setShowEmpty] = useState(itemsEmpty);
  useEffect(() => {
    if (!itemsEmpty) {
      setShowEmpty(false);
      return;
    }
    // Reduced-motion / test mocks skip exit callbacks — flip empty immediately.
    if (reduceMotion) {
      setShowEmpty(true);
      return;
    }
    const timer = window.setTimeout(() => setShowEmpty(true), 280);
    return () => window.clearTimeout(timer);
  }, [itemsEmpty, reduceMotion]);

  return (
    <div
      data-testid={testId}
      data-layout={layout}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-foreground min-w-0 truncate text-lg font-bold">
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
            'flex flex-1 items-center justify-end gap-2',
            showFilter
              ? 'min-w-0 basis-full sm:min-w-64 sm:basis-auto'
              : 'min-w-fit',
          )}
        >
          {showFilter ? (
            <Input
              data-testid="cards-row-filter"
              className="min-w-0 flex-1"
              size="sm"
              tone="secondary"
              placeholder={labels.filterPlaceholder}
              aria-label={labels.filterPlaceholder.replace(/(…|\.{3})$/, '')}
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              endAddon={
                filterText.trim() ? (
                  <Tooltip content="Clear filter" side="top">
                    <button
                      data-testid="cards-row-clear-filter"
                      type="button"
                      className="cursor-pointer"
                      onClick={clearFilter}
                      aria-label="Clear filter"
                    >
                      <Filter size={14} />
                    </button>
                  </Tooltip>
                ) : (
                  <span
                    data-testid="cards-row-filter-idle"
                    aria-hidden
                    className="pointer-events-none"
                  >
                    <Filter size={14} />
                  </span>
                )
              }
            />
          ) : null}
          {showScroll ? (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <Tooltip content="Scroll left" side="top">
                <Button
                  data-testid="cards-row-scroll-left"
                  size="icon-sm"
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  variant="secondary"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </Button>
              </Tooltip>
              <Tooltip content="Scroll right" side="top">
                <Button
                  data-testid="cards-row-scroll-right"
                  size="icon-sm"
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  variant="secondary"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </Button>
              </Tooltip>
            </div>
          ) : null}
          {allowListToggle ? (
            <div
              className="flex shrink-0 items-center gap-2"
              data-testid="cards-row-zoom"
            >
              <Tooltip
                content={layoutLabels[smallerLayout ?? layout]}
                side="top"
              >
                <Button
                  data-testid="cards-row-zoom-out"
                  size="icon-sm"
                  variant="secondary"
                  disabled={!smallerLayout}
                  aria-label={layoutLabels[smallerLayout ?? layout]}
                  onClick={() => smallerLayout && setLayout(smallerLayout)}
                >
                  <ZoomOut size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip
                content={layoutLabels[largerLayout ?? layout]}
                side="top"
              >
                <Button
                  data-testid="cards-row-zoom-in"
                  size="icon-sm"
                  variant="secondary"
                  disabled={!largerLayout}
                  aria-label={layoutLabels[largerLayout ?? layout]}
                  onClick={() => largerLayout && setLayout(largerLayout)}
                >
                  <ZoomIn size={16} aria-hidden />
                </Button>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>

      {showEmpty ? (
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
      ) : isList ? (
        <ul
          data-testid="cards-row-list"
          className="border-border text-foreground border-(length:--border-width) [&>li:last-child]:border-b-0"
        >
          <AnimatePresence
            initial={false}
            mode="popLayout"
            onExitComplete={() => {
              if (itemsEmpty) {
                setShowEmpty(true);
              }
            }}
          >
            {filteredItems.map((item, index) => (
              <CardsRowItemMotion
                key={item.id}
                itemId={item.id}
                as="li"
                className={cn('list-none', trackRowClass(index, false))}
              >
                {renderItem ? (
                  <CardLayoutContext.Provider value="row">
                    <div className="*:w-full">{renderItem(item)}</div>
                  </CardLayoutContext.Provider>
                ) : item.onClick ? (
                  <button
                    type="button"
                    data-testid="cards-row-list-item"
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 pr-2 text-left',
                      trackRowMinHeightClass,
                    )}
                    onClick={item.onClick}
                  >
                    <ListItemBody item={item} />
                  </button>
                ) : (
                  <div
                    data-testid="cards-row-list-item"
                    className={cn(
                      'flex w-full items-center gap-2 pr-2 text-left',
                      trackRowMinHeightClass,
                    )}
                  >
                    <ListItemBody item={item} />
                  </div>
                )}
              </CardsRowItemMotion>
            ))}
          </AnimatePresence>
        </ul>
      ) : isFull ? (
        <CardLayoutContext.Provider value="full">
          <div
            data-testid="cards-row-full"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence
              initial={false}
              mode="popLayout"
              onExitComplete={() => {
                if (itemsEmpty) {
                  setShowEmpty(true);
                }
              }}
            >
              {filteredItems.map((item) =>
                renderItem ? (
                  <CardsRowItemMotion
                    key={item.id}
                    itemId={item.id}
                    className="min-w-0 *:w-full"
                  >
                    {renderItem(item)}
                  </CardsRowItemMotion>
                ) : (
                  <CardsRowItemMotion key={item.id} itemId={item.id}>
                    <Card
                      src={item.imageUrl}
                      title={item.title}
                      subtitle={item.subtitle}
                      onClick={item.onClick}
                      surface={cardSurface}
                    />
                  </CardsRowItemMotion>
                ),
              )}
            </AnimatePresence>
          </div>
        </CardLayoutContext.Provider>
      ) : (
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-visible [scroll-behavior:smooth] pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <AnimatePresence
            initial={false}
            mode="popLayout"
            onExitComplete={() => {
              if (itemsEmpty) {
                setShowEmpty(true);
              }
            }}
          >
            {filteredItems.map((item) =>
              renderItem ? (
                <CardsRowItemMotion
                  key={item.id}
                  itemId={item.id}
                  className="shrink-0 [contain-intrinsic-size:auto_12rem] [content-visibility:auto]"
                >
                  {renderItem(item)}
                </CardsRowItemMotion>
              ) : (
                <CardsRowItemMotion
                  key={item.id}
                  itemId={item.id}
                  className="shrink-0 [contain-intrinsic-size:auto_12rem] [content-visibility:auto]"
                >
                  <Card
                    src={item.imageUrl}
                    title={item.title}
                    subtitle={item.subtitle}
                    onClick={item.onClick}
                    surface={cardSurface}
                  />
                </CardsRowItemMotion>
              ),
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
