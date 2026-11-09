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
    variant,
  } = useTabsContext();
  return (
    <TabList
      id={listId}
      aria-label={ariaLabel}
      className={cn(
        // Default wraps; callers that need a single scrollable row pass
        // `flex-nowrap overflow-x-auto` (see PHONE_SCROLL_TAB_LIST).
        'flex w-full flex-wrap items-center gap-2',
        variant === 'segmented' &&
          'bg-background-secondary w-fit max-w-full gap-1 rounded-lg p-1',
        variant === 'underline' && 'border-border gap-6 border-b',
        listClassName,
        className,
      )}
    >
      {children}
    </TabList>
  );
};
