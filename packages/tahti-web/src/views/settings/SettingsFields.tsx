import type { ReactNode } from 'react';

import { Toggle } from '@tahti-player/ui';

/** Nuclear Settings ToggleField pattern. */
export function SettingsToggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Toggle
          aria-label={label}
          checked={value}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="text-foreground text-sm font-semibold">{label}</span>
      </div>
      {description && (
        <p className="text-foreground-secondary text-sm select-none">
          {description}
        </p>
      )}
    </div>
  );
}

export function SettingsInfo({
  label,
  value,
  description,
}: {
  label: string;
  value: ReactNode;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-foreground text-sm font-semibold">{label}</span>
      <div className="border-border bg-background-secondary rounded-md border px-3 py-2 text-sm">
        {value}
      </div>
      {description && (
        <p className="text-foreground-secondary text-sm select-none">
          {description}
        </p>
      )}
    </div>
  );
}

export function SettingsHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-foreground-secondary text-sm leading-relaxed">
      {children}
    </p>
  );
}
