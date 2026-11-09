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
      variant="underline"
      className={className ?? 'w-full'}
      listClassName="tahti-hide-scrollbar flex-nowrap overflow-x-auto"
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
