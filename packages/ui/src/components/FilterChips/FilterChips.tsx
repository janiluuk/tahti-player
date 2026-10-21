import { cva } from 'class-variance-authority';
import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { useFilterChips, UseFilterChipsConfig } from './useFilterChips';

const chipVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-(length:--border-width) px-3 py-1 text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      selected: {
        true: 'bg-primary text-primary-foreground border-primary',
        false:
          'border-border text-foreground hover:bg-background-secondary bg-transparent',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export type FilterChip = {
  id: string;
  label: string;
  /** Optional leading icon, e.g. a lucide icon element — not for images/photos. */
  icon?: ReactNode;
};

type BaseProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  items: readonly FilterChip[];
  disabled?: boolean;
};

type SingleSelectProps = BaseProps & {
  multiple?: false;
  selected: string;
  onChange: (id: string) => void;
};

type MultiSelectProps = BaseProps & {
  multiple: true;
  selected: string[];
  onChange: (ids: string[]) => void;
};

export type FilterChipsProps = SingleSelectProps | MultiSelectProps;

export const FilterChips: FC<FilterChipsProps> = (props) => {
  const { items, className, multiple, selected, onChange, disabled, ...rest } =
    props;

  const hookConfig: UseFilterChipsConfig = multiple
    ? { multiple: true, selected, onChange }
    : {
        selected: selected as string,
        onChange: onChange as (id: string) => void,
      };

  const { isSelected, handleClick } = useFilterChips(hookConfig);

  return (
    <div
      data-testid="filter-chips"
      className={cn('flex flex-wrap gap-2', className)}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label="Filter options"
      {...rest}
    >
      {items.map((item) => {
        const checked = isSelected(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={checked}
            disabled={disabled}
            className={chipVariants({ selected: checked })}
            onClick={() => handleClick(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
