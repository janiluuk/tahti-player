import { Link } from '@tanstack/react-router';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Tooltip } from '../Tooltip/Tooltip';
import { useSidebarCompact } from './SidebarCompactContext';

type SidebarNavigationItemProps = {
  icon: ReactNode;
  label: string;
  isSelected?: boolean;
  to?: string;
  onClick?: () => void;
  /** Shown, named, and not a link. For menus that need an account. */
  disabled?: boolean;
};

const MaybeNavLink: FC<{
  to?: string;
  isSelected?: boolean;
  children: (isSelected: boolean) => ReactNode;
}> = ({ to, isSelected, children }) => {
  if (to) {
    const selectedProps = {
      className: 'active',
      'aria-current': 'page' as const,
    };
    return (
      <Link
        to={to}
        activeOptions={{ exact: to === '/', includeSearch: false }}
        activeProps={isSelected === false ? {} : selectedProps}
        inactiveProps={isSelected === true ? selectedProps : {}}
      >
        {({ isActive }) =>
          children(isSelected !== undefined ? isSelected : isActive)
        }
      </Link>
    );
  }
  return <>{children(Boolean(isSelected))}</>;
};

export const SidebarNavigationItem: FC<SidebarNavigationItemProps> = ({
  icon,
  label,
  isSelected,
  to,
  onClick,
  disabled = false,
}) => {
  const isCompact = useSidebarCompact();

  if (disabled) {
    return (
      <Tooltip content={label} side="right" disabled={!isCompact}>
        <button
          type="button"
          aria-disabled="true"
          aria-label={label}
          data-testid="sidebar-navigation-item"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="text-foreground-secondary flex min-h-8 w-full cursor-not-allowed items-center overflow-hidden rounded-md border-(length:--border-width) border-transparent text-left"
        >
          <div className="flex size-8 shrink-0 items-center justify-center">
            {icon}
          </div>
          {!isCompact && (
            <span className="text-sm whitespace-nowrap">{label}</span>
          )}
          {isCompact && <span className="sr-only">{label}</span>}
        </button>
      </Tooltip>
    );
  }

  return (
    <MaybeNavLink to={to} isSelected={isSelected}>
      {(routeActive) => {
        const active = isSelected !== undefined ? isSelected : routeActive;

        return (
          <Tooltip content={label} side="right" disabled={!isCompact}>
            <div
              role={onClick ? 'button' : undefined}
              onClick={onClick}
              data-testid="sidebar-navigation-item"
              className={cn(
                'flex min-h-8 w-full items-center overflow-hidden rounded-md border-(length:--border-width)',
                {
                  'cursor-pointer': onClick,
                  'bg-primary text-primary-foreground border-border font-bold':
                    active,
                  'hover:bg-background-secondary border-transparent': !active,
                },
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center">
                {icon}
              </div>
              {!isCompact && (
                <span className="text-sm whitespace-nowrap">{label}</span>
              )}
              {isCompact && <span className="sr-only">{label}</span>}
            </div>
          </Tooltip>
        );
      }}
    </MaybeNavLink>
  );
};
