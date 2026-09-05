import { memo } from 'react';

import { cn } from '../../utils';

type CardGridProps = {
  className?: string;
};

export const CardGrid = memo<CardGridProps>(({ className }) => (
  <div
    className={cn(
      'grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 pr-2 pb-4',
      className,
    )}
  >
  </div>
));