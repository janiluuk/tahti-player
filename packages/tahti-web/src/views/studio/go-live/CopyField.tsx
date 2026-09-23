import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, CopyButton, Tooltip } from '@tahti-player/ui';

// System rule: any field displaying a value meant to be copied (URLs,
// stream keys, credentials) pairs a visible <code> with the shared
// CopyButton (@tahti-player/ui) — this used to hand-roll the same
// check-icon-swap CopyButton already provides. See WORKPLAN.md's
// URL-field copy convention entry.
export function CopyField({
  label,
  value,
  maskable = false,
}: {
  label: string;
  value: string;
  /** Starts hidden behind dots with a reveal toggle — for secrets
   * (stream keys, passwords) rather than public-facing values (server
   * host, mount point). */
  maskable?: boolean;
}) {
  const [revealed, setRevealed] = useState(!maskable);
  return (
    <div className="border-border bg-background-secondary flex flex-col gap-1 rounded-lg border p-3">
      <div className="text-foreground-secondary font-mono text-xs tracking-wide uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="text-foreground flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">
          {revealed ? value : '•'.repeat(Math.min(value.length, 24))}
        </code>
        {maskable && (
          <Tooltip content={revealed ? `Hide ${label}` : `Show ${label}`}>
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            >
              {revealed ? (
                <EyeOffIcon size={14} aria-hidden />
              ) : (
                <EyeIcon size={14} aria-hidden />
              )}
            </Button>
          </Tooltip>
        )}
        <CopyButton
          text={value}
          variant="secondary"
          toastMessage={`${label} copied.`}
          aria-label={`Copy ${label}`}
        />
      </div>
    </div>
  );
}
