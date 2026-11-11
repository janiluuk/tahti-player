import { Link } from '@tanstack/react-router';
import { useEffect, useRef, type FC, type ReactNode } from 'react';

import { cn } from '../../utils';

export type NavLinksItem = {
  id: string;
  /** Path, optionally with a query string (`/studio/schedule?show=events`). */
  to: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  active?: boolean;
};

/** `underline`: a section's top-level pages. `fill`: the pages one level
 * below, as quiet control-surface chips. */
export type NavLinksVariant = 'underline' | 'fill';

export type NavLinksProps = {
  items: NavLinksItem[];
  variant?: NavLinksVariant;
  'aria-label': string;
  className?: string;
};

const EDGE_PADDING_PX = 32;

const LIST_CLASS =
  'flex min-w-0 flex-nowrap items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  'data-[fade=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] ' +
  'data-[fade=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-2rem),transparent)] ' +
  'data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,#000_2rem,#000_calc(100%-2rem),transparent)]';

// The list scrolls sideways, which clips anything drawn outside a link, so
// the focus outline sits inside the link's box.
const LINK_CLASS =
  'flex shrink-0 items-center gap-2 whitespace-nowrap no-underline transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0';

const VARIANT_CLASS: Record<
  NavLinksVariant,
  { list: string; link: string; active: string; inactive: string }
> = {
  underline: {
    list: 'gap-6 border-b border-border-subtle',
    link: '-mb-px h-11 rounded-t-control border-b-2 px-1 text-base',
    active: 'border-foreground text-foreground font-semibold',
    inactive:
      'border-transparent text-foreground-secondary font-medium hover:text-foreground',
  },
  fill: {
    list: 'gap-1',
    link: 'h-10 rounded-control px-3 text-sm',
    // Themes that leave out `background-input` derive it from the page
    // background, so the hairline keeps the current chip visible there.
    active:
      'bg-background-input text-foreground font-semibold ring-1 ring-border-subtle ring-inset',
    inactive:
      'text-foreground-secondary font-medium hover:bg-background-secondary hover:text-foreground',
  },
};

function edgeFade(list: HTMLElement): 'start' | 'end' | 'both' | undefined {
  const hiddenStart = list.scrollLeft > 1;
  const hiddenEnd = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
  if (hiddenStart && hiddenEnd) {
    return 'both';
  }
  return hiddenStart ? 'start' : hiddenEnd ? 'end' : undefined;
}

function syncFade(list: HTMLElement) {
  const fade = edgeFade(list);
  if (fade) {
    list.dataset.fade = fade;
  } else {
    delete list.dataset.fade;
  }
}

function splitTo(to: string): { path: string; search: Record<string, string> } {
  const [path = to, query] = to.split('?');
  return { path, search: Object.fromEntries(new URLSearchParams(query ?? '')) };
}

/** Route navigation as a row of links. The current page is marked with
 * `aria-current="page"`; the row scrolls sideways on narrow screens and keeps
 * the current link in view. Use `Tabs` for in-page panels instead. */
export const NavLinks: FC<NavLinksProps> = ({
  items,
  variant = 'underline',
  'aria-label': ariaLabel,
  className,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const activeId = items.find((item) => item.active)?.id;
  const styles = VARIANT_CLASS[variant];

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const update = () => syncFade(list);
    update();
    list.addEventListener('scroll', update, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !link || list.scrollWidth <= list.clientWidth) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const cutOff =
      linkRect.left < listRect.left + EDGE_PADDING_PX ||
      linkRect.right > listRect.right - EDGE_PADDING_PX;
    if (cutOff) {
      list.scrollLeft +=
        linkRect.left - listRect.left - (listRect.width - linkRect.width) / 2;
    }
    syncFade(list);
  }, [activeId]);

  return (
    <nav aria-label={ariaLabel} className={cn('min-w-0', className)}>
      <ul
        ref={listRef}
        className={cn(LIST_CLASS, styles.list)}
        data-variant={variant}
      >
        {items.map((item) => {
          const { path, search } = splitTo(item.to);
          return (
            <li key={item.id} className="flex shrink-0">
              <Link
                to={path}
                search={search}
                activeOptions={{ exact: true, includeSearch: true }}
                activeProps={{}}
                aria-current={item.active ? 'page' : undefined}
                data-testid="nav-link"
                className={cn(
                  LINK_CLASS,
                  styles.link,
                  item.active ? styles.active : styles.inactive,
                )}
              >
                {item.icon ? <span aria-hidden>{item.icon}</span> : null}
                {item.label}
                {item.count !== undefined ? (
                  <span className="text-foreground-secondary text-xs font-medium tabular-nums">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
