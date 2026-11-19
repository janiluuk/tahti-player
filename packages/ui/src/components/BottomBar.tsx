import { FC, ReactNode } from 'react';

import { cn } from '../utils';

type BottomBarProps = {
  children?: ReactNode;
  className?: string;
};

export const BottomBar: FC<BottomBarProps> = ({ children, className = '' }) => {
  return (
    <footer
      className={cn(
        'bg-background/95 border-border flex h-[4.5rem] items-center border-t-(length:--border-width) px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </footer>
  );
};
