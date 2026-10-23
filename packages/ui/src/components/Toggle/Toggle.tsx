import { Switch as HeadlessSwitch } from '@headlessui/react';
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';

import { cn } from '../../utils';

type ToggleProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onChange' | 'value' | 'role' | 'aria-checked'
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  /** Render `label` as visible text beside the switch (clicking it toggles)
   * instead of only as the accessible name. */
  showLabel?: boolean;
  /** Class for the visible label wrapper when `showLabel` is set. */
  labelClassName?: string;
  thumbIcon?: ReactNode;
  checkedThumbIcon?: ReactNode;
  name?: string;
  value?: string;
  form?: string;
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      className,
      disabled,
      label,
      showLabel = false,
      labelClassName,
      thumbIcon,
      checkedThumbIcon,
      name,
      value,
      form,
      ...rest
    },
    ref,
  ) => {
    const visible = showLabel && Boolean(label);
    const toggle = (
      <HeadlessSwitch
        as="button"
        type="button"
        ref={ref}
        checked={checked}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        onChange={(val: boolean) => onChange?.(val)}
        aria-label={visible ? undefined : label}
        disabled={disabled}
        name={name}
        value={value}
        form={form}
        className={cn(
          'border-border focus:ring-primary focus:ring-offset-background relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-(length:--border-width) transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'data-checked:bg-primary bg-background-secondary',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          'group',
          className,
        )}
        {...rest}
      >
        {({ checked }) => (
          <span
            className={cn(
              'border-border pointer-events-none flex h-4 w-4 items-center justify-center rounded-full border-(length:--border-width) bg-white ring-0 transition-transform [&>svg]:fill-white dark:[&>svg]:fill-black',
              // Positioning via data-attribute with group
              'translate-x-1 group-data-checked:translate-x-5',
            )}
          >
            {checked && checkedThumbIcon ? checkedThumbIcon : thumbIcon}
          </span>
        )}
      </HeadlessSwitch>
    );
    if (!visible) {
      return toggle;
    }
    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-sm',
          disabled && 'cursor-not-allowed opacity-70',
          labelClassName,
        )}
      >
        {toggle}
        <span>{label}</span>
      </label>
    );
  },
);
