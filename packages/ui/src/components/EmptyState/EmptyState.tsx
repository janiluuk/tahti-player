import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center',
  {
    variants: {
      size: {
        sm: 'gap-2 p-4',
        default: 'gap-4 p-8',
        lg: 'gap-6 p-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

type EmptyStateProps = Omit<ComponentProps<'div'>, 'title'> &
  VariantProps<typeof emptyStateVariants> & {
    icon?: ReactNode;
    title: string;
    /** 1 when the empty state is the whole page, e.g. "Page not found". */
    headingLevel?: 1 | 2;
    description?: string;
    action?: ReactNode;
  };

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  headingLevel = 2,
  description,
  action,
  size,
  className,
  ...props
}) => (
  <div
    data-testid="empty-state"
    className={cn(emptyStateVariants({ size, className }))}
    {...props}
  >
    {icon && <div className="text-foreground">{icon}</div>}
    <div className="flex flex-col gap-1">
      {headingLevel === 1 ? (
        <h1 className="text-foreground text-lg font-bold">{title}</h1>
      ) : (
        <h2 className="text-foreground text-lg font-bold">{title}</h2>
      )}
      {description && (
        <p className="text-foreground text-sm opacity-60">{description}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);
