import { PanelLeft, PanelRight } from 'lucide-react';
import { motion } from 'motion/react';
import { FC, ReactNode, useRef } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { SIDEBAR_CONFIG } from './constants';
import { useSidebarResize } from './hooks';

export type PlayerWorkspaceSidebarPropsBase = {
  children?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  persistentFooter?: ReactNode;
  isCollapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggle: () => void;
  className?: string;
};

type PlayerWorkspaceSidebarProps = PlayerWorkspaceSidebarPropsBase & {
  side: 'left' | 'right';
};

export const PlayerWorkspaceSidebar: FC<PlayerWorkspaceSidebarProps> = ({
  children,
  headerActions,
  footer,
  persistentFooter,
  isCollapsed,
  width,
  onWidthChange,
  onToggle,
  side,
  className = '',
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { handleMouseDown, isResizingState } = useSidebarResize(
    width,
    onWidthChange,
    side,
    isCollapsed,
  );

  const currentWidth = isCollapsed ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : width;

  return (
    <motion.div
      ref={sidebarRef}
      initial={false}
      className={cn(
        'bg-background-secondary border-border relative flex flex-col overflow-hidden',
        {
          'border-r-(length:--border-width)': side === 'left',
          'border-l-(length:--border-width)': side === 'right',
          'p-2': !isCollapsed,
        },
        className,
      )}
      animate={{ width: currentWidth }}
      transition={
        isResizingState
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }
      }
    >
      <span
        className={cn('flex shrink-0 flex-row items-center', {
          'mb-1 justify-center px-0.5 pt-1': isCollapsed,
          'mb-3 justify-end': !isCollapsed && side === 'left',
          'mb-3 justify-start': !isCollapsed && side === 'right',
        })}
      >
        <Tooltip
          content={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          side="top"
        >
          <Button
            data-testid={`sidebar-toggle-${side}`}
            variant={isCollapsed ? 'text' : 'secondary'}
            size="icon-sm"
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-pressed={!isCollapsed}
            className={cn(
              'size-7 transition-all',
              isCollapsed
                ? 'text-foreground-secondary opacity-45 hover:opacity-100'
                : 'opacity-100',
            )}
            onClick={onToggle}
          >
            {side === 'left' ? (
              <PanelLeft size={14} strokeWidth={isCollapsed ? 1.75 : 2.25} />
            ) : (
              <PanelRight size={14} strokeWidth={isCollapsed ? 1.75 : 2.25} />
            )}
          </Button>
        </Tooltip>
        {!isCollapsed && headerActions && (
          <span className="flex flex-1 items-center justify-end gap-1">
            {headerActions}
          </span>
        )}
      </span>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          !isCollapsed && 'pt-1',
        )}
      >
        {children}
        {!isCollapsed && footer && (
          <div className="mt-auto flex justify-center">{footer}</div>
        )}
      </div>

      {persistentFooter && (
        <div className="mt-auto flex flex-col items-center gap-2 py-2">
          {persistentFooter}
        </div>
      )}

      {!isCollapsed && (
        <div
          className={cn(
            'absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors',
            side === 'left' ? 'right-0' : 'left-0',
          )}
          onMouseDown={handleMouseDown}
        />
      )}
    </motion.div>
  );
};
