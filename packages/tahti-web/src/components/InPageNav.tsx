import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { TabLabel, Tabs } from '@tahti-player/ui';

export type InPageNavItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  /** Route path for Link mode */
  to?: string;
  params?: Record<string, string>;
  /** Button mode */
  onSelect?: () => void;
  active?: boolean;
};

/**
 * Sparse in-page tabs — wraps Storybook `Tabs` so Library/Studio/Channel
 * style section chips share the same chrome.
 *
 * Orphan in live app routes today (Storybook-only); prefer `Tabs` /
 * `SectionTabs` directly for new surfaces. See docs/todo/tabs-migration.md.
 */
/** Storybook-first (`Tahti/Page/InPageNav`); reserved for long-form in-page tabs. */
export function InPageNav({
  items,
  'aria-label': ariaLabel = 'Section',
}: {
  items: InPageNavItem[];
  'aria-label'?: string;
}) {
  const navigate = useNavigate();
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.active),
  );

  return (
    <Tabs.Root
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const next = items[index];
        if (!next) {
          return;
        }
        if (next.to) {
          void navigate({ to: next.to as never, params: next.params as never });
          return;
        }
        next.onSelect?.();
      }}
      listClassName="border-border border-b pb-3"
    >
      <Tabs.List aria-label={ariaLabel} className="w-fit flex-wrap">
        {items.map((item) => (
          <Tabs.Tab key={item.id}>
            <TabLabel icon={item.icon} count={item.count}>
              {item.label}
            </TabLabel>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
