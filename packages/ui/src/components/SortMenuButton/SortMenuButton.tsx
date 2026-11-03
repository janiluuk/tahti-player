import { ArrowUpDownIcon, CheckIcon } from 'lucide-react';

import { Button } from '../Button';
import { Popover } from '../Popover';

export type SortMenuOption<T extends string = string> = {
  id: T;
  label: string;
};

export type SortMenuButtonProps<T extends string = string> = {
  options: readonly SortMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** What is sorted, e.g. `Sort tracks`; the current order is appended. */
  label?: string;
  /** The order that counts as "not sorted"; any other shows the button
   * filled so a custom order is visible at a glance. */
  defaultValue?: T;
  'data-testid'?: string;
};

/** Sort control for list toolbars: a sort-icon button opening the orders,
 * with the current one checked. Replaces a full-width select. */
export const SortMenuButton = <T extends string = string>({
  options,
  value,
  onChange,
  label = 'Sort',
  defaultValue,
  'data-testid': testId = 'sort-menu-button',
}: SortMenuButtonProps<T>) => {
  const current =
    options.find((option) => option.id === value)?.label ??
    options[0]?.label ??
    '';
  const custom = defaultValue !== undefined && value !== defaultValue;
  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: `${label}: ${current}`, side: 'top' }}
      trigger={
        <Button
          size="icon-sm"
          variant={custom ? 'default' : 'secondary'}
          aria-label={`${label} (${current})`}
          data-testid={testId}
        >
          <ArrowUpDownIcon size={16} aria-hidden />
        </Button>
      }
      panelClassName="min-w-44"
    >
      <Popover.Menu aria-label={label}>
        {options.map((option) => (
          <Popover.Item
            key={option.id}
            role="menuitemradio"
            aria-checked={option.id === value}
            icon={
              <CheckIcon
                size={16}
                className={option.id === value ? undefined : 'invisible'}
              />
            }
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Popover.Item>
        ))}
      </Popover.Menu>
    </Popover>
  );
};
