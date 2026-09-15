import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

export type SelectableListItem = {
  id: string;
  /** Primary line, e.g. a name. */
  title: ReactNode;
  /** Secondary line shown under the title, e.g. a username or detail. */
  subtitle?: ReactNode;
  /** Right-aligned badge/text on the title row, e.g. a role or status. */
  meta?: ReactNode;
};

export type SelectableListProps = Omit<
  ComponentProps<'ul'>,
  'onChange' | 'children'
> & {
  items: readonly SelectableListItem[];
  selected: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
};

/**
 * A single-select list of clickable rows (title + optional subtitle/meta),
 * for pickers like "choose a user/item to view details about" — a radiogroup
 * of rows rather than `FilterChips`' inline pill group.
 */
export const SelectableList: FC<SelectableListProps> = ({
  items,
  selected,
  onChange,
  disabled,
  className,
  ...rest
}) => (
  <ul
    data-testid="selectable-list"
    className={cn('flex flex-col gap-1', className)}
    role="radiogroup"
    {...rest}
  >
    {items.map((item) => {
      const checked = selected === item.id;
      return (
        <li key={item.id}>
          <button
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
              checked
                ? 'border-primary bg-primary/10'
                : 'hover:border-border hover:bg-background-secondary border-transparent',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{item.title}</span>
              {item.meta ? (
                <span className="text-foreground-secondary shrink-0 text-[10px] font-semibold tracking-wide uppercase">
                  {item.meta}
                </span>
              ) : null}
            </span>
            {item.subtitle ? (
              <span className="text-foreground-secondary block truncate text-xs">
                {item.subtitle}
              </span>
            ) : null}
          </button>
        </li>
      );
    })}
  </ul>
);
