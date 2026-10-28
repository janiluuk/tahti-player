import { useClose } from '@headlessui/react';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

const popoverItemVariants = cva(
  'flex w-full cursor-pointer items-center gap-3 border-t border-transparent px-3 py-2 text-left text-sm outline-none not-last:border-b first:border-t-0 last:border-b-0',
  {
    variants: {
      intent: {
        default: '',
        danger: 'text-accent-red-strong',
      },
      align: {
        left: '',
        center: 'justify-center text-center',
      },
      highlight: {
        hover:
          'hover:bg-background-secondary hover:text-foreground hover:border-border focus-visible:bg-background-secondary focus-visible:text-foreground',
        controlled: '',
      },
    },
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
