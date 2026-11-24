import type { ReactNode } from 'react';

import { HelpTip, Toggle, useUiLabels } from '@tahti-player/ui';

/** Nuclear Settings ToggleField pattern. */
export function SettingsToggle({
  label,
  description,
  help,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  /** Explanation behind a help icon next to the label instead of a
   * paragraph under it. */
  help?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const labels = useUiLabels();
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
        {help ? (
          <HelpTip label={labels.aboutNamed(label)} content={help} />
        ) : null}
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

/** One row of a bordered settings list: icon, label, current value, a short
 * note and an action (edit, manage). Wrap rows in a `<ul>`. */
export function SettingsRow({
  icon,
  label,
  value,
  note,
  action,
  'data-testid': testId,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  note?: string;
  action: ReactNode;
  'data-testid'?: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3" data-testid={testId}>
      <span
        aria-hidden
        className="bg-background-secondary text-foreground flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {value ? <span className="truncate text-sm">{value}</span> : null}
        {note ? (
          <span className="text-foreground-secondary text-xs">{note}</span>
        ) : null}
      </div>
      {action}
    </li>
  );
}
