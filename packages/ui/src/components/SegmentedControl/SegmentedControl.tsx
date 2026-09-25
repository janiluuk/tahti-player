import { ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

export type SegmentedControlOption<T extends string> = {
  id: T;
  /** Accessible name; also the tooltip text when `iconOnly` is set. */
  label: string;
  icon?: ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Name of the whole group, e.g. "Schedule view". */
  'aria-label': string;
  /** Render icons only, with each option's label as its tooltip. */
  iconOnly?: boolean;
  className?: string;
};

/** A single-choice group of adjacent buttons, e.g. a card/list view switch. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  iconOnly = false,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'border-border flex gap-1 rounded-md border p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const checked = option.id === value;
        const button = (
          <Button
            key={option.id}
            role="radio"
            aria-checked={checked}
            aria-label={iconOnly ? option.label : undefined}
            size={iconOnly ? 'icon-sm' : 'xs'}
            variant="text"
            className={cn('gap-1.5', checked && 'bg-primary/15 text-primary')}
            onClick={() => onChange(option.id)}
          >
            {option.icon}
            {iconOnly ? null : option.label}
          </Button>
        );
        return iconOnly ? (
          <Tooltip key={option.id} content={option.label} side="top">
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}
