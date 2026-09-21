import type { ReactNode } from 'react';

export type CapabilityKind =
  'not-in-client' | 'coming-soon' | 'partial' | 'link-out' | 'mock-only';

const KIND_LABEL: Record<CapabilityKind, string> = {
  'not-in-client': 'Not available in this client',
  'coming-soon': 'Coming soon',
  partial: 'Partial',
  'link-out': 'Opens tahti.live',
  'mock-only': 'Preview only',
};

/**
 * Honest UX callout for surfaces that are missing, thin, link-out, or mock-only.
 * Prefer this over silent fake success or dead controls that look live.
 */
export function ClientCapabilityNotice({
  kind = 'not-in-client',
  title,
  children,
  action,
  className = '',
}: {
  kind?: CapabilityKind;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      role="note"
      className={`border-border bg-background-secondary/50 flex flex-col gap-2 rounded-lg border px-3 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="border-border text-foreground-secondary inline-block rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          {KIND_LABEL[kind]}
        </span>
        {title && (
          <span className="text-foreground text-sm font-semibold">{title}</span>
        )}
      </div>
      <div className="text-foreground-secondary text-sm leading-relaxed">
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2 pt-0.5">{action}</div>}
    </aside>
  );
}
