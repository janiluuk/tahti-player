import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { CardLayoutContext } from '../Card/CardLayoutContext';

type CardGridProps = {
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/** Cards fill their grid track: a fixed-width card in a `minmax` track
 * either overflows the track (clipping the last column) or leaves a gap. */
export const CardGrid: FC<CardGridProps> = ({
  children,
  className,
  'data-testid': dataTestId,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 pr-2 pb-4',
        className,
      )}
      data-testid={dataTestId}
    >
      <CardLayoutContext.Provider value="full">
        {children}
      </CardLayoutContext.Provider>
    </div>
  );
};
