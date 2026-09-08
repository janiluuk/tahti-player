import type { ReactNode } from 'react';

import { Button } from '@tahti-player/ui';

/** Elevated studio panel — consistent padding, border, subtle depth. */
export function StudioPanel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-border bg-background-secondary/40 rounded-xl border p-5 shadow-sm sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="font-display text-lg font-bold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-foreground-secondary mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small bordered toggle chip (type/style filter pills) — was duplicated
 * verbatim as StudioCollectionsView's StyleChip and StudioReleasesView's
 * TypeChip. */
export function StudioToggleChip({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="text"
      size="flexible"
      className={`gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
        selected
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border text-foreground-secondary'
      }`}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
