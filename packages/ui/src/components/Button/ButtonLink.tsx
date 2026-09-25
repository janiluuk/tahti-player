import { createLink } from '@tanstack/react-router';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';
import { buttonVariants, type ButtonVariantProps } from './Button';

export type ButtonAnchorProps = ComponentPropsWithoutRef<'a'> &
  ButtonVariantProps & {
    /** Renders without an `href`, so it cannot be followed or focused. */
    disabled?: boolean;
  };

/** A plain `<a>` styled as a `Button`, for external URLs and downloads. */
export const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(
  function ButtonAnchor(
    { variant, size, intent, className, disabled, href, tabIndex, ...rest },
    ref,
  ) {
    return (
      <a
        ref={ref}
        href={disabled ? undefined : href}
        tabIndex={disabled ? -1 : tabIndex}
        aria-disabled={disabled || undefined}
        className={cn(
          buttonVariants({ variant, size, intent }),
          'focus-visible:ring-primary focus-visible:ring-2',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);

/** A router `Link` styled as a `Button`; use instead of nesting a `Button` in a `Link`. */
export const ButtonLink = createLink(ButtonAnchor);
