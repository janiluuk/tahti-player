import isEmpty from 'lodash-es/isEmpty';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { CardsRowItem } from './CardsRow';

const SCROLL_INCREMENT = 176;

type UseCardsRowResult<T extends CardsRowItem> = {
  filterText: string;
  setFilterText: (text: string) => void;
  clearFilter: () => void;
  filteredItems: T[];
  scrollContainerRef: RefObject<HTMLDivElement>;
  scrollLeft: () => void;
  scrollRight: () => void;
  showControls: boolean;
};

export function useCardsRow<T extends CardsRowItem>(
  items: T[],
): UseCardsRowResult<T> {
  const [filterText, setFilterText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (isEmpty(filterText.trim())) {
      return items;
    }
    const lowerFilter = filterText.toLowerCase();
    return items.filter((item) =>
      item.title.toLowerCase().includes(lowerFilter),
    );
  }, [items, filterText]);

  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }
    const measure = () =>
      setOverflowing(element.scrollWidth > element.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of Array.from(element.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [filteredItems]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({
      left: -SCROLL_INCREMENT,
      behavior: 'smooth',
    });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({
      left: SCROLL_INCREMENT,
      behavior: 'smooth',
    });
  };

  const clearFilter = () => {
    setFilterText('');
  };

  return {
    filterText,
    setFilterText,
    clearFilter,
    filteredItems,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
    showControls: overflowing || !isEmpty(filterText.trim()),
  };
}
