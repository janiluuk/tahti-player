import { Tab } from '@headlessui/react';
import { FC, Fragment, PropsWithChildren } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { useTabsContext } from './context';

type TabsTabProps = PropsWithChildren<{
  disabled?: boolean;
  className?: string;
  title?: string;
  'aria-label'?: string;
}>;

export const TabsTab: FC<TabsTabProps> = ({
  children,
  disabled,
  className,
  title,
  'aria-label': ariaLabel,
}) => {
  const { tabClassName, variant } = useTabsContext();
  return (
    <Tab as={Fragment} disabled={disabled}>
      {({ selected }) => (
        <Button
          type="button"
          disabled={disabled}
          size="xs"
          variant={
            variant === 'pill' ? (selected ? 'default' : 'text') : 'plain'
          }
          className={cn(
            variant === 'segmented' &&
              'text-foreground-secondary hover:text-foreground h-8 rounded-md px-3 text-sm font-medium active:scale-100',
            variant === 'segmented' &&
              selected &&
              'bg-background text-foreground ring-border [&_svg]:text-primary shadow-sm ring-1',
            variant === 'underline' &&
              'text-foreground-secondary hover:text-foreground relative -mb-px h-9 rounded-none border-b-2 border-transparent px-0.5 text-sm font-medium active:scale-100',
            variant === 'underline' &&
              selected &&
              'border-primary text-foreground [&_svg]:text-primary',
            tabClassName,
            className,
          )}
          data-selected={selected ? '' : undefined}
          title={title}
          aria-label={ariaLabel}
        >
          {children}
        </Button>
      )}
    </Tab>
  );
};
