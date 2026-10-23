import { ComponentPropsWithoutRef, FC } from 'react';

import { cn } from '../../utils';

export type InlineErrorProps = Omit<ComponentPropsWithoutRef<'p'>, 'role'> & {
  /** `xs` for dense rows, dialog footers and list items. */
  textSize?: 'xs' | 'sm';
  /** `false` for a standing notice that is part of the page rather than a
   * response to something the user just did, so it is not announced. */
  announce?: boolean;
};

/** Error line under a form, row or panel; announced when it appears. */
export const InlineError: FC<InlineErrorProps> = ({
  textSize = 'sm',
  announce = true,
  className,
  ...rest
}) => (
  <p
    role={announce ? 'alert' : undefined}
    className={cn(
      'text-accent-red-strong',
      textSize === 'xs' ? 'text-xs' : 'text-sm',
      className,
    )}
    {...rest}
  />
);
