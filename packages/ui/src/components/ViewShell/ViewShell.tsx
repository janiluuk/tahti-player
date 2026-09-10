import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { ScrollableArea } from '../ScrollableArea';

type ViewShellClasses = {
  root?: string;
  scrollableArea?: string;
};

type ViewShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /**
   * Icon buttons (Add new, Edit, ...) shown top-right, opposite the
   * title. When set, the header switches to a left title / right
   * actions row with tighter spacing before the content.
   */
  actions?: ReactNode;
  'data-testid'?: string;
  classes?: ViewShellClasses;
};

export const ViewShell: FC<ViewShellProps> = ({
  children,
  title,
  subtitle,
  actions,
  'data-testid': dataTestId,
  classes,
}) => (
  <div
    className={cn(
      'bg-background relative flex h-full min-h-0 w-full flex-1 flex-col items-start justify-start px-6 pt-6',
      classes?.root,
    )}
    data-testid={dataTestId}
  >
    {actions ? (
      <div className="mb-3 flex w-full flex-0 flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col text-left">
          {title && (
            <h1 className="text-3xl font-bold" data-testid="title">
              {title}
            </h1>
          )}
          {subtitle && (
            <h2 className="mt-1 text-xl font-semibold">{subtitle}</h2>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-row items-center gap-2 pt-1">
          {actions}
        </div>
      </div>
    ) : (
      <>
        {title && (
          <h1
            className="mb-6 flex w-full flex-0 flex-row text-center text-3xl font-bold"
            data-testid="title"
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 className="mb-4 flex w-full flex-0 flex-row text-center text-xl font-semibold">
            {subtitle}
          </h2>
        )}
      </>
    )}
    <ScrollableArea
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col',
        classes?.scrollableArea,
      )}
    >
      {children}
    </ScrollableArea>
  </div>
);
