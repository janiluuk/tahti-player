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
};

export const SectionTitle: FC<SectionTitleProps> = ({
  title,
  badge,
  badgeColor = 'purple',
  className,
  ...props
}) => (
  <div
    data-testid="section-title"
    className={cn('flex items-center gap-2', className)}
    {...props}
  >
    <h2 className="text-foreground text-lg font-bold whitespace-nowrap">
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
