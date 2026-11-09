import { TabGroup } from '@headlessui/react';
import { FC, PropsWithChildren, useId } from 'react';

import { cn } from '../../utils';
import { TabsContext, type TabsVariant } from './context';

type TabsRootProps = PropsWithChildren<{
  defaultIndex?: number;
  selectedIndex?: number;
  onChange?: (index: number) => void;
  vertical?: boolean;
  manual?: boolean;
  /** `segmented` (default) is a quiet track with a raised active chip;
   * `underline` marks the active tab with a primary underline, for a
   * page row; `pill` fills the active tab with the primary colour. */
  variant?: TabsVariant;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelsClassName?: string;
  panelClassName?: string;
}>;

export const TabsRoot: FC<TabsRootProps> = ({
  children,
  defaultIndex,
  selectedIndex,
  onChange,
  vertical,
  manual,
  variant = 'segmented',
  className,
  listClassName,
  tabClassName,
  panelsClassName,
  panelClassName,
}) => {
  const reactId = useId();
  const groupId = `tabs-${reactId}`;
  const listId = `${groupId}-list`;
  const panelsId = `${groupId}-panels`;

  return (
    <TabGroup
      as="div"
      className={cn('flex max-h-full w-full flex-col gap-2', className)}
      defaultIndex={selectedIndex === undefined ? defaultIndex : undefined}
      selectedIndex={selectedIndex}
      onChange={onChange}
      vertical={vertical}
      manual={manual}
    >
      {({ selectedIndex: idx }) => (
        <TabsContext.Provider
          value={{
            ids: { groupId, listId, panelsId },
            selectedIndex: idx,
            vertical,
            manual,
            variant,
            listClassName,
            tabClassName,
            panelsClassName,
            panelClassName,
          }}
        >
          {children}
        </TabsContext.Provider>
      )}
    </TabGroup>
  );
};
