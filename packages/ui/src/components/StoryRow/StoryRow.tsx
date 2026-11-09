import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Children,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

export type StoryRowProps = {
  title: ReactNode;
  children: ReactNode;
  /** Extra header controls before the scroll buttons, e.g. Remove. */
  actions?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/** Horizontal strip of wide cards: most of one card on phones, two from
 * `md`, three from `xl`. Previous / next buttons, styled like `CardsRow`'s,
 * page by one view. */
export const StoryRow: FC<StoryRowProps> = ({
  title,
  children,
  actions,
  className,
  'data-testid': testId = 'story-row',
}) => {
  // Two rows can sit on one page (Feed); naming the buttons after the row
  // keeps them distinguishable for screen readers.
  const rowName = typeof title === 'string' ? title : undefined;
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const element = scroller.current;
    if (!element) {
      return;
    }
    const measure = () => {
      setAtStart(element.scrollLeft <= 1);
      setAtEnd(
        element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      );
    };
    measure();
    element.addEventListener('scroll', measure, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      element.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [children]);

  const page = (direction: 1 | -1) => {
    const element = scroller.current;
    element?.scrollBy({
      left: direction * element.clientWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section
      data-testid={testId}
      className={cn('flex flex-col gap-4', className)}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-foreground text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          {atStart && atEnd ? null : (
            <>
              <Tooltip content="Previous" side="top">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={rowName ? `Previous: ${rowName}` : 'Previous'}
                  disabled={atStart}
                  onClick={() => page(-1)}
                >
                  <ChevronLeft size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Next" side="top">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={rowName ? `Next: ${rowName}` : 'Next'}
                  disabled={atEnd}
                  onClick={() => page(1)}
                >
                  <ChevronRight size={16} aria-hidden />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </header>
      <div
        ref={scroller}
        data-testid="story-row-track"
        className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {Children.map(children, (child) => (
          <div className="w-[85%] shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] xl:w-[calc((100%-3rem)/3)]">
            {child}
          </div>
        ))}
      </div>
    </section>
  );
};
