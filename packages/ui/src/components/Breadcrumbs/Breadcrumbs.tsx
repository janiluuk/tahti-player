import { createLink } from '@tanstack/react-router';
import {
  Children,
  ComponentPropsWithoutRef,
  FC,
  forwardRef,
  Fragment,
  isValidElement,
  ReactNode,
} from 'react';

import { cn } from '../../utils';

export type BreadcrumbsProps = Omit<
  ComponentPropsWithoutRef<'nav'>,
  'children'
> & {
  /** `BreadcrumbLink` / `BreadcrumbAnchor` ancestors, then one `BreadcrumbCurrent`. */
  children: ReactNode;
};

/** Trail of ancestor pages above a page title, e.g. `Admin → Governance → Grants`.
 * Separators are added between the children. */
export const Breadcrumbs: FC<BreadcrumbsProps> = ({
  children,
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
  ...rest
}) => {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <nav
      aria-label={ariaLabel}
      data-testid="breadcrumbs"
      className={cn(
        'text-foreground-secondary flex flex-wrap items-center gap-1 text-xs',
        className,
      )}
      {...rest}
    >
      {items.map((item, index) => (
        <Fragment key={item.key ?? index}>
          {index > 0 ? <span aria-hidden>→</span> : null}
          {item}
        </Fragment>
      ))}
    </nav>
  );
};

export type BreadcrumbAnchorProps = ComponentPropsWithoutRef<'a'>;

/** A plain `<a>` crumb, for links outside the router. */
export const BreadcrumbAnchor = forwardRef<
  HTMLAnchorElement,
  BreadcrumbAnchorProps
>(function BreadcrumbAnchor({ className, ...rest }, ref) {
  return <a ref={ref} className={cn('hover:underline', className)} {...rest} />;
});

/** A router `Link` crumb pointing at an ancestor page. */
export const BreadcrumbLink = createLink(BreadcrumbAnchor);

/** The last crumb: the page the user is on. */
export const BreadcrumbCurrent: FC<ComponentPropsWithoutRef<'span'>> = ({
  className,
  ...rest
}) => <span aria-current="page" className={className} {...rest} />;
