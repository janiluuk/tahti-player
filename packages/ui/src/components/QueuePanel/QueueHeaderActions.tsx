import { EllipsisIcon, Trash2Icon } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Popover } from '../Popover';
import { Tooltip } from '../Tooltip';

export type QueueHeaderView = {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
};

export type QueueHeaderMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

export type QueueHeaderActionsProps = {
  /** Toggles that swap the sidebar body (e.g. chat, notifications). */
  views?: QueueHeaderView[];
  onClearQueue?: () => void;
  clearDisabled?: boolean;
  menuItems?: QueueHeaderMenuItem[];
  labels?: {
    clearQueue?: string;
    more?: string;
  };
  className?: string;
};

export const QueueHeaderActions: FC<QueueHeaderActionsProps> = ({
  views = [],
  onClearQueue,
  clearDisabled = false,
  menuItems = [],
  labels,
  className,
}) => {
  const clearLabel = labels?.clearQueue ?? 'Clear queue';
  const moreLabel = labels?.more ?? 'More queue actions';

  return (
    <span
      data-testid="queue-header-actions"
      className={cn('flex flex-1 items-center gap-1', className)}
    >
      {views.map((view) => (
        <Tooltip key={view.id} content={view.label} side="bottom">
          <Button
            data-testid={`queue-header-view-${view.id}`}
            size="icon"
            variant={view.isActive ? 'default' : 'text'}
            aria-label={view.label}
            aria-pressed={Boolean(view.isActive)}
            className="relative"
            onClick={view.onClick}
          >
            {view.icon}
            {view.count ? (
              <Badge
                variant="pill"
                color="purple"
                className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] leading-4"
              >
                {view.count > 99 ? '99+' : view.count}
              </Badge>
            ) : null}
          </Button>
        </Tooltip>
      ))}

      <span className="flex-1" />

      {onClearQueue ? (
        <Tooltip content={clearLabel} side="bottom">
          <Button
            data-testid="clear-queue-button"
            size="icon"
            aria-label={clearLabel}
            disabled={clearDisabled}
            onClick={onClearQueue}
          >
            <Trash2Icon />
          </Button>
        </Tooltip>
      ) : null}

      {menuItems.length > 0 ? (
        <Popover
          trigger={
            <Button
              size="icon"
              data-testid="queue-more-button"
              aria-label={moreLabel}
            >
              <EllipsisIcon />
            </Button>
          }
          anchor="bottom end"
        >
          <Popover.Menu>
            {menuItems.map((item) => (
              <Popover.Item
                key={item.id}
                data-testid={`queue-menu-${item.id}`}
                icon={item.icon}
                disabled={item.disabled}
                className="disabled:cursor-not-allowed disabled:opacity-50"
                onClick={item.onClick}
              >
                {item.label}
              </Popover.Item>
            ))}
          </Popover.Menu>
        </Popover>
      ) : null}
    </span>
  );
};
