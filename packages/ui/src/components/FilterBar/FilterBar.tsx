import { SearchIcon } from 'lucide-react';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Input } from '../Input';

export type FilterBarProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Controlled search field value. Omit to hide the search input. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Accessible name when the field has no visible label. */
  searchLabel?: string;
  /** Visible label above the search field. */
  searchFieldLabel?: string;
  searchClassName?: string;
  searchTone?: 'primary' | 'secondary';
  /** Clear button or other trailing control. Idle until the field has a value. */
  searchEndAddon?: ReactNode;
  searchEndAddonActive?: boolean;
  /** Chips, selects, segmented controls, or other filter controls. */
  children?: ReactNode;
};

/** One toolbar row for list pages: optional search plus filter slots.
 * Put FilterChips / Select / SegmentedControl in `children`. */
export const FilterBar: FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  searchFieldLabel,
  searchClassName,
  searchTone,
  searchEndAddon,
  searchEndAddonActive,
  children,
  className,
  ...rest
}) => {
  const showSearch =
    searchValue !== undefined && typeof onSearchChange === 'function';
  return (
    <div
      className={cn('flex w-full flex-wrap items-center gap-3', className)}
      data-testid="filter-bar"
      {...rest}
    >
      {showSearch ? (
        <div className={cn('min-w-48 flex-1 basis-48', searchClassName)}>
          <Input
            enterKeyHint="search"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchFieldLabel ? undefined : searchLabel}
            label={searchFieldLabel}
            size="sm"
            tone={searchTone}
            startAddon={<SearchIcon size={14} aria-hidden />}
            endAddon={searchEndAddon}
            endAddonActive={searchEndAddonActive}
          />
        </div>
      ) : null}
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
};
