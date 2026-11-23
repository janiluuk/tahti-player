import { Button as HeadlessButton } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';

export const buttonVariants = cva(
  'focus-visible:ring-primary inline-flex cursor-pointer touch-manipulation items-center rounded-md whitespace-nowrap transition-all duration-100 ease-out outline-none focus-visible:ring-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground bg-primary border-border shadow-shadow not-disabled:hover:translate-x-shadow-x not-disabled:hover:translate-y-shadow-y border-(length:--border-width) not-disabled:hover:shadow-none not-disabled:hover:brightness-95',
        secondary:
          'border-border shadow-shadow not-disabled:hover:translate-x-shadow-x not-disabled:hover:translate-y-shadow-y bg-secondary text-secondary-foreground border-(length:--border-width) not-disabled:hover:shadow-none not-disabled:hover:brightness-95',
        tertiary:
          'border-border shadow-shadow not-disabled:hover:translate-x-shadow-x not-disabled:hover:translate-y-shadow-y bg-background-secondary text-foreground border-(length:--border-width) not-disabled:hover:shadow-none not-disabled:hover:brightness-95',
        noShadow:
          'text-primary-foreground bg-primary border-border border-(length:--border-width) not-disabled:hover:brightness-95',
        text: 'text-foreground not-disabled:hover:bg-foreground/5 not-disabled:active:bg-foreground/10 bg-transparent',
        ghost:
          'not-disabled:hover:bg-foreground/10 not-disabled:active:bg-foreground/15 border border-current bg-transparent',
        plain: '',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        xs: 'h-8 px-2 text-sm',
        lg: 'h-11 px-8',
        icon: 'size-10 justify-center',
        'icon-sm': 'size-8 justify-center',
        flexible: 'h-auto',
      },
      intent: {
        danger: 'bg-accent-red text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type ButtonProps = ComponentPropsWithoutRef<'button'> & ButtonVariantProps;

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { variant, size, intent, className, children, type, ...rest },
  ref,
) {
  return (
    <HeadlessButton
      as="button"
      ref={ref}
      className={cn(buttonVariants({ variant, size, intent, className }))}
      type={type ?? 'button'}
      {...rest}
    >
      {children}
    </HeadlessButton>
  );
});
