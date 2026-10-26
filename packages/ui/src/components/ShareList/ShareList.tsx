import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Meter } from '../Meter';

export type ShareListItem = {
  id: string;
  label: string;
  share: number;
  icon?: ReactNode;
};

type ShareListProps = ComponentProps<'div'> & {
  title?: string;
  headingLevel?: 2 | 3 | 4;
  items: ShareListItem[];
  formatShare?: (share: number) => string;
  emptyLabel?: string;
};

const defaultFormatShare = (share: number) =>
  `${(share * 100).toLocaleString(undefined, { maximumFractionDigits: share < 0.1 ? 1 : 0 })} %`;

export const ShareList: FC<ShareListProps> = ({
  title,
  headingLevel = 3,
  items,
  formatShare = defaultFormatShare,
  emptyLabel = 'No data yet.',
  className,
  ...props
}) => {
  const Heading = `h${headingLevel}` as const;
  const max = Math.max(0, ...items.map((item) => item.share));
  const withIcons = items.some((item) => item.icon != null);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)} {...props}>
      {title ? (
        <Heading className="font-heading text-base font-semibold">
          {title}
        </Heading>
      ) : null}
      {items.length === 0 ? (
        <p className="text-foreground-secondary text-sm">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid="share-list-row"
              className={cn(
                'grid items-center gap-x-2 gap-y-1 text-sm',
                withIcons
                  ? 'grid-cols-[auto_1fr_auto]'
                  : 'grid-cols-[1fr_auto]',
              )}
            >
              {withIcons ? (
                <span
                  aria-hidden
                  className="text-foreground-secondary flex size-5 items-center justify-center"
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="min-w-0 truncate">{item.label}</span>
              <span className="text-foreground-secondary tabular-nums">
                {formatShare(item.share)}
              </span>
              <Meter
                value={item.share}
                max={max || 1}
                aria-label={`${item.label} ${formatShare(item.share)}`}
                className={withIcons ? 'col-start-2 col-end-4' : 'col-span-2'}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
