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

export const PHONE_SCROLL_TAB_LIST =
  'tahti-hide-scrollbar max-sm:w-full max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1';

export function useSelectedTabInView(selectedKey: string | number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const tab = ref.current?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      const list = tab?.closest<HTMLElement>('[role="tablist"]');
      if (!tab || !list || list.scrollWidth <= list.clientWidth) {
        return;
      }
      list.scrollLeft =
        tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedKey]);
  return ref;
}

/** A section's page list as a row of small icon tabs, meant to sit
 * directly below a primary section-tabs row (see AdminNav.tsx's
 * AdminPageLayout) — not a left-docked sidebar column. Always a
 * horizontal row: it wraps when it runs out of space, except on phones,
 * where it stays on one line and scrolls sideways. Smaller than the
 * primary tabs above it so the two rows read as tab → sub-tab. */
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
        selectedIndex={Math.max(0, selectedIndex)}
        onChange={(index) => {
          const next = items[index];
          if (next) {
            void navigate({ to: next.to as never });
          }
        }}
        tabClassName={
          selectedIndex < 0
            ? 'data-[selected]:bg-transparent data-[selected]:text-foreground-secondary'
            : undefined
        }
      >
        <Tabs.List
          aria-label={ariaLabel}
          className={`w-fit flex-wrap ${PHONE_SCROLL_TAB_LIST}`}
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
