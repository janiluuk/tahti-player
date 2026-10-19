import type { LucideIcon } from 'lucide-react';

import { TabLabel, Tabs } from '@tahti-player/ui';

export type ModerationTabItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type ModerationTabsProps = {
  activeId: string;
  items: ModerationTabItem[];
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
};

export const ModerationTabs = ({
  activeId,
  items,
  onChange,
  ariaLabel,
  className,
}: ModerationTabsProps) => {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );

  return (
    <Tabs.Root
      selectedIndex={selectedIndex}
      onChange={(index) => onChange(items[index].id)}
      className={className ?? 'w-full'}
      listClassName="flex flex-nowrap gap-3 overflow-x-auto"
      tabClassName="h-8 rounded-md border border-border px-2.5 text-xs font-semibold tracking-wide uppercase"
    >
      <Tabs.List aria-label={ariaLabel}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={<Icon size={14} />}>{item.label}</TabLabel>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
};
