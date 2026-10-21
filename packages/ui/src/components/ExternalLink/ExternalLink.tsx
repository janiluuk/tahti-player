import { ExternalLinkIcon } from 'lucide-react';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';

export type ExternalLinkProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'target' | 'rel'
> & {
  /** Show the trailing "opens elsewhere" icon. */
  showIcon?: boolean;
};

/** Underlined link that opens in a new tab with safe `rel` attributes. */
export const ExternalLink = forwardRef<HTMLAnchorElement, ExternalLinkProps>(
  function ExternalLink({ className, children, showIcon, ...rest }, ref) {
    return (
      <a
        ref={ref}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2',
          className,
        )}
        {...rest}
      >
        {children}
        {showIcon ? <ExternalLinkIcon size={12} aria-hidden /> : null}
      </a>
    );
  },
);
