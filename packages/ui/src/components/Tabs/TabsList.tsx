import { TabList } from '@headlessui/react';
import { FC, PropsWithChildren } from 'react';

import { cn } from '../../utils';
import { useTabsContext } from './context';

type TabsListProps = PropsWithChildren<{
  className?: string;
  'aria-label'?: string;
}>;

export const TabsList: FC<TabsListProps> = ({
  children,
  className,
  'aria-label': ariaLabel,
}) => {
  const {
    ids: { listId },
    listClassName,
  } = useTabsContext();
  return (
    <TabList
      id={listId}
      aria-label={ariaLabel}
      className={cn(
        'flex w-full flex-wrap items-center gap-2',
        listClassName,
        className,
      )}
    >
      {children}
    </TabList>
  );
};
