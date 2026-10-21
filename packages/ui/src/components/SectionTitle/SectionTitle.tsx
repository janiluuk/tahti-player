import { ComponentProps, FC } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';

export type SectionTitleBadgeColor =
  | 'green'
  | 'cyan'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'blue'
  | 'secondary'
  | 'inverted';

type SectionTitleProps = Omit<ComponentProps<'div'>, 'title'> & {
  title: string;
  badge?: string;
  badgeColor?: SectionTitleBadgeColor;
  /** Let a long title and its badge wrap onto more lines instead of overflowing. */
  wrap?: boolean;
};

export const SectionTitle: FC<SectionTitleProps> = ({
  title,
  badge,
  badgeColor = 'purple',
  wrap = false,
  className,
  ...props
}) => (
  <div
    data-testid="section-title"
    className={cn('flex items-center gap-2', wrap && 'flex-wrap', className)}
    {...props}
  >
    <h2
      className={cn(
        'text-foreground text-lg font-bold',
        !wrap && 'whitespace-nowrap',
      )}
    >
      {title}
    </h2>
    {badge ? (
      <Badge
        data-testid="section-title-badge"
        variant="pill"
        color={badgeColor}
      >
        {badge}
      </Badge>
    ) : null}
  </div>
);
