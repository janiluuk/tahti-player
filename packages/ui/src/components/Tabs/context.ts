import { createContext, useContext } from 'react';

export type TabsVariant = 'pill' | 'segmented' | 'underline';

type TabsContextValue = {
  ids: {
    groupId: string;
    listId: string;
    panelsId: string;
  };
  selectedIndex: number;
  vertical?: boolean;
  manual?: boolean;
  variant: TabsVariant;
  listClassName?: string;
  tabClassName?: string;
  panelsClassName?: string;
  panelClassName?: string;
};

export const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabsContext = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs.* must be used within <Tabs.Root>');
  }
  return ctx;
};
