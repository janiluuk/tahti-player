import { ChevronRightIcon, type LucideIcon } from 'lucide-react';
import { type FC, type ReactNode } from 'react';

import { cn } from '../../utils';

export type HubCardItem = {
  id: string;
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short status beside the title, e.g. `3 drafts` or `Not set up`. */
  badge?: string;
};

export type HubCardsProps = {
  items: HubCardItem[];
  /** Wraps a card in a link, e.g. a router Link. Defaults to a plain anchor. */
  renderLink?: (
    href: string,
    children: ReactNode,
    className: string,
  ) => ReactNode;
  'aria-label'?: string;
  className?: string;
};

const defaultLink = (href: string, children: ReactNode, className: string) => (
  <a href={href} className={className}>
    {children}
  </a>
);

const CARD_CLASS =
  'group border-border bg-background-secondary/40 hover:bg-background-secondary focus-visible:ring-primary flex h-full min-w-0 items-start gap-3 rounded-lg border p-3 no-underline transition-colors focus-visible:ring-2 focus-visible:outline-none';

/** A section's hub: one card per tool, each opening a focused page. Used
 * where a second row of tabs would otherwise appear. */
export const HubCards: FC<HubCardsProps> = ({
  items,
  renderLink = defaultLink,
  'aria-label': ariaLabel,
  className,
}) => (
  <div className={cn('@container', className)}>
    <ul
      aria-label={ariaLabel}
      data-testid="hub-cards"
      className="grid grid-cols-1 gap-2 @lg:grid-cols-2 @4xl:grid-cols-3"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.id}
            className="min-w-0"
            data-testid={`hub-card-${item.id}`}
          >
            {renderLink(
              item.href,
              <>
                <span className="bg-primary/15 text-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-foreground truncate text-sm font-semibold">
                      {item.title}
                    </span>
                    {item.badge ? (
                      <span className="text-foreground-secondary border-border rounded-full border px-1.5 text-[11px] leading-4">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-foreground-secondary text-xs">
                    {item.description}
                  </span>
                </span>
                <ChevronRightIcon
                  size={16}
                  aria-hidden
                  className="text-foreground-secondary mt-2.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </>,
              CARD_CLASS,
            )}
          </li>
        );
      })}
    </ul>
  </div>
);
