import { CircleHelpIcon } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { cn } from '../lib/cn';

/**
 * Collapsible inline help disclosure. Instructional copy for a page or
 * section lives here, expanded on demand, instead of sitting as permanent
 * subtext under a header. Ported from tahti's `DesignerHelpLayer`
 * (apps/web/src/app/dashboard/channel/_designer-help-layer.tsx).
 */
export function HelpLayer({
  title = 'Help',
  children,
  defaultOpen = false,
  className,
}: {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <button
        type="button"
        className="border-border text-foreground-secondary hover:text-foreground hover:bg-background-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <CircleHelpIcon size={14} aria-hidden />
        {open ? 'Hide help' : title}
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Section help"
          className="border-border bg-background-secondary/40 text-foreground-secondary flex w-full flex-col gap-2 rounded-lg border p-3 text-sm leading-relaxed"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
