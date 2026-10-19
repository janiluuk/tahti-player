import { createLink } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

export const backButtonClassName =
  'size-12 shrink-0 justify-center rounded-full border-0 bg-background/55 text-foreground shadow-none backdrop-blur-md hover:bg-background/80 hover:translate-x-0 hover:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-30';

export const backButtonCornerClassName = 'absolute top-3 left-3 z-30 w-fit';

export type BackButtonDirection = 'back' | 'forward';

type SharedProps = {
  direction?: BackButtonDirection;
  className?: string;
};

function BackIcon({ direction }: { direction: BackButtonDirection }) {
  const Icon = direction === 'forward' ? ArrowRight : ArrowLeft;
  return <Icon size={28} absoluteStrokeWidth aria-hidden />;
}

export type BackButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> &
  SharedProps;

export const BackButton = forwardRef<HTMLElement, BackButtonProps>(
  function BackButton(
    { direction = 'back', className, 'aria-label': ariaLabel, type, ...rest },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        type={type ?? 'button'}
        variant="plain"
        size="icon"
        aria-label={
          ariaLabel ?? (direction === 'forward' ? 'Go forward' : 'Go back')
        }
        className={cn(backButtonClassName, className)}
        {...rest}
      >
        <BackIcon direction={direction} />
      </Button>
    );
  },
);

export type BackButtonAnchorProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'children'
> &
  SharedProps & {
    disabled?: boolean;
  };

export const BackButtonAnchor = forwardRef<
  HTMLAnchorElement,
  BackButtonAnchorProps
>(function BackButtonAnchor(
  {
    direction = 'back',
    className,
    disabled,
    href,
    tabIndex,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      tabIndex={disabled ? -1 : tabIndex}
      aria-disabled={disabled || undefined}
      aria-label={
        ariaLabel ?? (direction === 'forward' ? 'Go forward' : 'Go back')
      }
      className={cn(
        'focus-visible:ring-primary inline-flex cursor-pointer touch-manipulation items-center outline-none focus-visible:ring-2',
        backButtonClassName,
        disabled && 'pointer-events-none cursor-not-allowed opacity-30',
        className,
      )}
      {...rest}
    >
      <BackIcon direction={direction} />
    </a>
  );
});

export const BackButtonLink = createLink(BackButtonAnchor);
