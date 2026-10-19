import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { cn } from '../../utils';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'onChange'
> & {
  onChange?: (checked: boolean) => void;
  label?: string;
};

/** A native checkbox in the theme's accent colour, for multi-select lists. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ onChange, label, className, ...rest }, ref) => {
    const input = (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'accent-primary h-4 w-4 shrink-0 cursor-pointer align-middle disabled:cursor-not-allowed disabled:opacity-50',
          label ? undefined : className,
        )}
        onChange={(event) => onChange?.(event.target.checked)}
        {...rest}
      />
    );
    if (!label) {
      return input;
    }
    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-sm',
          className,
        )}
      >
        {input}
        {label}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
