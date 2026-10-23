import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Input } from '../Input';

export type ColorFieldProps = {
  label: string;
  /** Hex colour shown in the swatch. */
  value: string;
  onChange: (value: string) => void;
  /** Line under the label; defaults to the hex value. */
  detail?: ReactNode;
  /** Rendered after the label, outside it, so buttons (reset, preview)
   * do not become part of the clickable label. */
  actions?: ReactNode;
  /** Smaller swatch and padding, label only (no detail line). */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
};

export const ColorField: FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
  detail,
  actions,
  compact = false,
  disabled,
  className,
}) => {
  return (
    <div
      className={cn(
        'border-border bg-background-secondary/40 flex items-center rounded-lg border text-sm',
        compact ? 'gap-2 p-2' : 'gap-3 p-2.5',
        className,
      )}
    >
      <label
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center',
          compact ? 'gap-2' : 'gap-3',
          disabled && 'cursor-not-allowed opacity-70',
        )}
      >
        <Input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={compact ? 'h-8 w-9' : undefined}
          aria-label={label}
        />
        {compact ? (
          <span className="min-w-0 truncate text-xs font-semibold">
            {label}
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{label}</span>
            <span
              className={cn(
                'text-foreground-secondary block text-xs',
                detail === undefined && 'font-mono',
              )}
            >
              {detail ?? value}
            </span>
          </span>
        )}
      </label>
      {actions}
    </div>
  );
};
