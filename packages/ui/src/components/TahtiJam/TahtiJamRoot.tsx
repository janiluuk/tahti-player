import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

export type TahtiJamProps = {
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
};

export const TahtiJamRoot: FC<TahtiJamProps> = ({
  children,
  className,
  'data-testid': dataTestId,
}) => (
  <div
    data-testid={dataTestId}
    className={cn(
      'bg-background text-foreground flex h-dvh flex-col overflow-hidden',
      className,
    )}
  >
    {children}
  </div>
);
