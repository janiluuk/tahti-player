import { Button as HeadlessButton } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';

export const buttonVariants = cva(
  'inline-flex cursor-pointer touch-manipulation items-center rounded-md whitespace-nowrap transition-all duration-100 ease-out outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground bg-primary border-border shadow-shadow hover:translate-x-shadow-x hover:translate-y-shadow-y border-(length:--border-width) hover:shadow-none',
        secondary:
          'border-border shadow-shadow hover:translate-x-shadow-x hover:translate-y-shadow-y bg-secondary text-secondary-foreground border-(length:--border-width) hover:shadow-none',
        tertiary:
          'border-border shadow-shadow hover:translate-x-shadow-x hover:translate-y-shadow-y bg-background-secondary text-foreground border-(length:--border-width) hover:shadow-none',
        noShadow:
          'text-primary-foreground bg-primary border-border border-(length:--border-width)',
        text: 'text-foreground bg-transparent hover:bg-black/5 active:bg-black/10',
        ghost:
          'border border-current bg-transparent hover:bg-black/10 active:bg-black/15',
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
