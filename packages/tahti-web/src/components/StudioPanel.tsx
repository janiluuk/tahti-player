import type { ComponentType, ReactNode } from 'react';

import { HelpTip, useUiLabels } from '@tahti-player/ui';

/** Elevated studio panel — consistent padding, border, subtle depth. */
export function StudioPanel({
  id,
  title,
  icon: Icon,
  description,
  help,
  action,
  children,
  compact = false,
  className = '',
}: {
  id?: string;
  title?: string;
  /** Optional leading icon rendered before the title. */
  icon?: ComponentType<{
    size?: number | string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>;
  description?: ReactNode;
  /** Explanation behind a help icon next to the title, in place of a
   * description paragraph. */
  help?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** Tighter padding and a smaller heading for dense dashboard strips. */
  compact?: boolean;
  className?: string;
}) {
  const labels = useUiLabels();
  const heading = (
    <h2
      className={`font-display flex items-center gap-2 font-bold tracking-tight ${compact ? 'text-base' : 'text-lg'}`}
    >
      {Icon && <Icon size={compact ? 16 : 18} aria-hidden />}
      {title}
    </h2>
  );
  return (
    <section
      id={id}
      className={`border-border bg-background-secondary/40 rounded-xl border shadow-sm ${compact ? 'p-3 sm:p-4' : 'p-3 sm:p-6'} ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex flex-wrap items-start justify-between ${!children ? 'gap-3' : compact ? 'mb-2 gap-2' : 'mb-4 gap-3'}`}
        >
          <div className="min-w-40 flex-1">
            {title && help ? (
              <div className="flex items-center gap-1">
                {heading}
                <HelpTip label={labels.aboutNamed(title)} content={help} />
              </div>
            ) : title ? (
              heading
            ) : null}
            {description ? (
              <p className="text-foreground-secondary mt-1 text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="max-w-full shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
