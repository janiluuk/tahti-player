import {
  type ComponentProps,
  type FC,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';

type StatChipProps = ComponentProps<'div'> & {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  /** When set, the chip is a keyboard-accessible button. */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
};

export const StatChip: FC<StatChipProps> = ({
  value,
  label,
  icon,
  className,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}) => {
  const interactive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (!onClick || event.defaultPrevented) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      className={cn(
        'border-border bg-background text-foreground shadow-shadow flex items-center gap-2 rounded-md border-(length:--border-width) px-2 py-1',
        interactive && 'hover:border-primary cursor-pointer',
        className,
      )}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
      onClick={onClick}
      onKeyDown={interactive || onKeyDown ? handleKeyDown : onKeyDown}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-heading text-lg font-extrabold">{value}</span>
      <span className="text-foreground-secondary text-xs font-bold tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
};
