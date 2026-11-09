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
              'text-foreground-secondary hover:text-foreground h-10 rounded-md px-4 text-base font-medium active:scale-100 [&_svg]:size-[18px]',
            variant === 'segmented' &&
              selected &&
              'bg-background text-foreground ring-border [&_svg]:text-primary font-semibold shadow-sm ring-1',
            variant === 'underline' &&
              'text-foreground-secondary hover:text-foreground relative -mb-px h-11 rounded-none border-b-[3px] border-transparent px-1 text-base font-medium active:scale-100 [&_svg]:size-[18px]',
            variant === 'underline' &&
              selected &&
              'border-primary text-foreground [&_svg]:text-primary font-semibold',
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
