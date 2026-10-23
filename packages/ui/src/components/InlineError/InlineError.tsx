import { ComponentPropsWithoutRef, FC } from 'react';

import { cn } from '../../utils';

export type InlineErrorProps = Omit<ComponentPropsWithoutRef<'p'>, 'role'> & {
  /** `xs` for dense rows, dialog footers and list items. */
  textSize?: 'xs' | 'sm';
};

/** Error line under a form, row or panel; announced when it appears. */
export const InlineError: FC<InlineErrorProps> = ({
  textSize = 'sm',
  className,
  ...rest
}) => (
  <p
    role="alert"
    className={cn(
      'text-accent-red-strong',
      textSize === 'xs' ? 'text-xs' : 'text-sm',
      className,
    )}
    {...rest}
  />
);
