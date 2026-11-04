import { SearchIcon } from 'lucide-react';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Input } from '../Input';

export type FilterBarProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Controlled search field value. Omit to hide the search input. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
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
        <div className="min-w-48 flex-1 basis-48">
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            size="sm"
            startAddon={<SearchIcon size={14} aria-hidden />}
          />
        </div>
      ) : null}
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
};
