import type { ReactNode } from 'react';

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
