import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import {
  useFilterChips,
  UseFilterChipsConfig,
} from '../FilterChips/useFilterChips';

export type SelectableTile = {
  id: string;
  label: string;
  /** Optional leading icon, e.g. a lucide icon element. */
  icon?: ReactNode;
  /** Optional supporting copy shown under the label. */
  description?: string;
};

type BaseProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  items: readonly SelectableTile[];
  disabled?: boolean;
  /**
   * `row` (default): icon left, label + description stacked to its right —
   * for a list of tiles with descriptive copy.
   * `centered`: icon above a centered label, no description row — for a
   * compact picker grid (e.g. a guide/format selector).
   */
  layout?: 'row' | 'centered';
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

export type SelectableTilesProps = SingleSelectProps | MultiSelectProps;

export const SelectableTiles: FC<SelectableTilesProps> = (props) => {
  const {
    items,
    className,
    multiple,
    selected,
    onChange,
    disabled,
    layout = 'row',
    ...rest
  } = props;

  const hookConfig: UseFilterChipsConfig = multiple
    ? { multiple: true, selected, onChange }
    : {
        selected: selected as string,
        onChange: onChange as (id: string) => void,
      };

  const { isSelected, handleClick } = useFilterChips(hookConfig);

  return (
    <div
      data-testid="selectable-tiles"
      className={cn('grid gap-2', className)}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label="Selectable options"
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
            onClick={() => handleClick(item.id)}
            className={cn(
              'rounded-lg border-(length:--border-width) p-3 text-left text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
              checked
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-foreground-secondary hover:text-foreground',
              layout === 'centered'
                ? 'flex min-h-24 flex-col items-center justify-center gap-2 text-center'
                : 'flex items-start gap-2',
            )}
          >
            {item.icon && (
              <span className="shrink-0" aria-hidden>
                {item.icon}
              </span>
            )}
            <span
              className={layout === 'centered' ? undefined : 'min-w-0 flex-1'}
            >
              <span className="block">{item.label}</span>
              {item.description && (
                <span className="text-foreground-secondary block text-xs font-normal">
                  {item.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
