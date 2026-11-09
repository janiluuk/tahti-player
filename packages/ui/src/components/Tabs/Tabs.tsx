import { FC, ReactNode } from 'react';

import { Badge } from '../Badge';
import type { TabsVariant } from './context';
import { TabsList } from './TabsList';
import { TabsPanel } from './TabsPanel';
import { TabsPanels } from './TabsPanels';
import { TabsRoot } from './TabsRoot';
import { TabsTab } from './TabsTab';

export type TabsItem = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  /** Optional leading icon (Lucide or similar). */
  icon?: ReactNode;
  /** Optional count shown as a pill Badge after the label. */
  count?: number;
};

export type TabsProps = {
  items?: TabsItem[];
  defaultIndex?: number;
  selectedIndex?: number;
  onChange?: (index: number) => void;
  vertical?: boolean;
  manual?: boolean;
  variant?: TabsVariant;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelsClassName?: string;
  panelClassName?: string;
  /** Icon (and count) only; the label stays as the tab's accessible name
   * and hover title. Items need an `icon` and a string `label`. */
  iconOnly?: boolean;
};

export type { TabsVariant };

type TabsComponent = FC<TabsProps> & {
  Root: typeof TabsRoot;
  List: typeof TabsList;
  Tab: typeof TabsTab;
  Panels: typeof TabsPanels;
  Panel: typeof TabsPanel;
};

/** Shared label chrome for composition-mode tabs (icon + text + optional count pill). */
export const TabLabel: FC<{
  icon?: ReactNode;
  count?: number;
  children: ReactNode;
}> = ({ icon, count, children }) => (
  <span className="inline-flex items-center gap-1.5">
    {icon ? (
      <span className="shrink-0 [&>svg]:size-3.5" aria-hidden>
        {icon}
      </span>
    ) : null}
    {children}
    {count != null ? (
      <Badge
        variant="pill"
        color="secondary"
        className="min-w-4 px-1.5 text-[10px] leading-3"
      >
        {count}
      </Badge>
    ) : null}
  </span>
);

const TabsImpl: FC<TabsProps> = ({
  items,
  defaultIndex,
  selectedIndex,
  onChange,
  vertical,
  manual,
  variant,
  className,
  listClassName,
  tabClassName,
  panelsClassName,
  panelClassName,
  iconOnly = false,
}) => {
  if (!items || items.length === 0) {
    // Composition mode only. Consumer uses Tabs.Root + subcomponents
    return (
      <TabsRoot
        defaultIndex={defaultIndex}
        selectedIndex={selectedIndex}
        onChange={onChange}
        vertical={vertical}
        manual={manual}
        variant={variant}
        className={className}
        listClassName={listClassName}
        tabClassName={tabClassName}
        panelsClassName={panelsClassName}
        panelClassName={panelClassName}
      />
    );
  }

  return (
    <TabsRoot
      defaultIndex={defaultIndex}
      selectedIndex={selectedIndex}
      onChange={onChange}
      vertical={vertical}
      manual={manual}
      variant={variant}
      className={className}
      listClassName={listClassName}
      tabClassName={tabClassName}
      panelsClassName={panelsClassName}
      panelClassName={panelClassName}
    >
      <TabsList>
        {items.map((item) => {
          const name =
            typeof item.label === 'string'
              ? item.count != null
                ? `${item.label} (${item.count})`
                : item.label
              : undefined;
          return iconOnly && item.icon ? (
            <TabsTab
              key={item.id}
              disabled={item.disabled}
              title={name}
              aria-label={name}
            >
              <TabLabel icon={item.icon} count={item.count}>
                {null}
              </TabLabel>
            </TabsTab>
          ) : (
            <TabsTab key={item.id} disabled={item.disabled}>
              <TabLabel icon={item.icon} count={item.count}>
                {item.label}
              </TabLabel>
            </TabsTab>
          );
        })}
      </TabsList>
      <TabsPanels>
        {items.map((item) => (
          <TabsPanel key={item.id}>{item.content}</TabsPanel>
        ))}
      </TabsPanels>
    </TabsRoot>
  );
};

export const Tabs = TabsImpl as TabsComponent;
Tabs.Root = TabsRoot;
Tabs.List = TabsList;
Tabs.Tab = TabsTab;
Tabs.Panels = TabsPanels;
Tabs.Panel = TabsPanel;
