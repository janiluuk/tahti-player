import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

const alertVariants = cva('rounded-lg border px-4 py-3 text-sm', {
  variants: {
    tone: {
      neutral: 'border-border bg-background-secondary/30 text-foreground',
      info: 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue-strong',
      warning:
        'border-accent-yellow/40 bg-accent-yellow/10 text-accent-yellow-strong',
      success:
        'border-accent-green/40 bg-accent-green/10 text-accent-green-strong',
      error: 'border-accent-red/40 bg-accent-red/10 text-accent-red-strong',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

const ALERT_ROLE: Record<
  NonNullable<AlertProps['tone']>,
  'alert' | 'status'
> = {
  neutral: 'status',
  info: 'status',
  warning: 'status',
  success: 'status',
  error: 'alert',
};

type AlertProps = Omit<ComponentProps<'div'>, 'title'> &
  VariantProps<typeof alertVariants> & {
    icon?: ReactNode;
    title?: ReactNode;
    children: ReactNode;
  };

/** Inline warning/status box -- the shared home for what was previously a
 * hand-rolled `<p className="border-accent-red/40 bg-accent-red/10 ...">`
 * repeated across AdminLogsView, StudioRevenueView, StudioSoundView, and
 * AdminDashboardView. `tone` picks the accent color; `role` defaults to
 * "alert" for `error` (assertive) and "status" for everything else
 * (polite), matching the roles those call sites already used by hand. */
export const Alert: FC<AlertProps> = ({
  tone = 'neutral',
  icon,
  title,
  children,
  className,
  role,
  ...props
}) => (
  <div
    className={cn(alertVariants({ tone, className }))}
    role={role ?? ALERT_ROLE[tone ?? 'neutral']}
    {...props}
  >
    <div className="flex gap-2">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  </div>
);
