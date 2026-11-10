import { useClose } from '@headlessui/react';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

const popoverItemVariants = cva(
  'flex w-full cursor-pointer items-center gap-2.5 border-t border-transparent px-3 py-1.5 text-left text-xs leading-snug transition-colors duration-100 ease-out outline-none not-last:border-b first:border-t-0 last:border-b-0 motion-reduce:transition-none',
  {
    variants: {
      intent: {
        default: 'text-foreground-secondary',
        danger: 'text-accent-red-strong/80',
      },
      align: {
        left: '',
        center: 'justify-center text-center',
      },
      highlight: {
        hover: 'hover:bg-black/5 focus-visible:bg-black/5 active:bg-black/10',
        controlled: '',
      },
    },
    compoundVariants: [
      {
        intent: 'default',
        highlight: 'hover',
        class:
          'hover:text-foreground focus-visible:text-foreground active:text-foreground',
      },
      {
        intent: 'danger',
        highlight: 'hover',
        class:
          'hover:text-accent-red-strong focus-visible:text-accent-red-strong active:text-accent-red-strong',
      },
    ],
    defaultVariants: {
      intent: 'default',
      align: 'left',
      highlight: 'hover',
    },
  },
);

type PopoverItemProps = Omit<ComponentProps<'button'>, 'children'> &
  VariantProps<typeof popoverItemVariants> & {
    icon?: ReactNode;
    children: ReactNode;
    /** Close the surrounding Popover after `onClick` (action items). */
    closeOnClick?: boolean;
  };

export const PopoverItem: FC<PopoverItemProps> = ({
  className,
  intent,
  align,
  highlight,
  icon,
  children,
  closeOnClick = false,
  onClick,
  ...props
}) => {
  const close = useClose();
  return (
    <button
      className={cn(
        popoverItemVariants({ intent, align, highlight, className }),
      )}
      onClick={(event) => {
        onClick?.(event);
        if (closeOnClick) {
          close();
        }
      }}
      {...props}
    >
      <span className="w-4 shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
};
