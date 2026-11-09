import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, type ReactNode } from 'react';

import { TabLabel, Tabs } from '@tahti-player/ui';

export type SectionTabsItem = {
  id: string;
  to: string;
  label: string;
  icon: ReactNode;
  count?: number;
  active?: boolean;
};

export const PHONE_SCROLL_TAB_LIST = [
  'tahti-hide-scrollbar w-full min-w-0 flex-nowrap overflow-x-auto pb-1',
  'data-[fade=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]',
  'data-[fade=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-2rem),transparent)]',
  'data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,#000_2rem,#000_calc(100%-2rem),transparent)]',
].join(' ');

const TAB_EDGE_PADDING_PX = 32;

/** Which edges of a sideways-scrolling tab strip hide more tabs. */
export function tabStripFade(list: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}): 'start' | 'end' | 'both' | undefined {
  const hiddenStart = list.scrollLeft > 1;
  const hiddenEnd = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
  if (hiddenStart && hiddenEnd) {
    return 'both';
  }
  return hiddenStart ? 'start' : hiddenEnd ? 'end' : undefined;
}

function syncFade(list: HTMLElement) {
  const fade = tabStripFade(list);
  if (fade) {
    list.dataset.fade = fade;
  } else {
    delete list.dataset.fade;
  }
}

/** Keeps the selected tab of a sideways-scrolling strip in view and clear
 * of the edge fade, and sets the strip's `data-fade` so cut-off tabs read
 * as scrollable. */
export function useSelectedTabInView(selectedKey: string | number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = ref.current?.querySelector<HTMLElement>('[role="tablist"]');
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
    const frame = requestAnimationFrame(() => {
      const tab = ref.current?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      const list = tab?.closest<HTMLElement>('[role="tablist"]');
      if (!tab || !list || list.scrollWidth <= list.clientWidth) {
        return;
      }
      const listRect = list.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const cutOff =
        tabRect.left < listRect.left + TAB_EDGE_PADDING_PX ||
        tabRect.right > listRect.right - TAB_EDGE_PADDING_PX;
      if (cutOff) {
        list.scrollLeft +=
          tabRect.left - listRect.left - (listRect.width - tabRect.width) / 2;
      }
      syncFade(list);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedKey]);
  return ref;
}

/** A section's page list as a row of small icon tabs, meant to sit
 * directly below a primary section-tabs row (see AdminNav.tsx's
 * AdminPageLayout) — not a left-docked sidebar column. Always a
 * single horizontal row that scrolls sideways when tabs overflow.
 * Smaller than the primary tabs above it so the two rows read as
 * tab → sub-tab. */
export function SectionTabs({
  items,
  'aria-label': ariaLabel,
}: {
  items: SectionTabsItem[];
  'aria-label': string;
}) {
  const navigate = useNavigate();
  const selectedIndex = items.findIndex((item) => item.active);
  const ref = useSelectedTabInView(selectedIndex);

  return (
    <div ref={ref} className="min-w-0">
      <Tabs.Root
        variant="underline"
        selectedIndex={Math.max(0, selectedIndex)}
        onChange={(index) => {
          const next = items[index];
          if (!next) {
            return;
          }
          const [path, query] = next.to.split('?');
          const search = Object.fromEntries(new URLSearchParams(query ?? ''));
          void navigate({
            to: path as never,
            search: search as never,
          });
        }}
        tabClassName={
          selectedIndex < 0
            ? 'data-[selected]:text-foreground-secondary data-[selected]:border-transparent'
            : undefined
        }
      >
        <Tabs.List
          aria-label={ariaLabel}
          className={`${PHONE_SCROLL_TAB_LIST} pb-0`}
        >
          {items.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={item.icon} count={item.count}>
                {item.label}
              </TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
