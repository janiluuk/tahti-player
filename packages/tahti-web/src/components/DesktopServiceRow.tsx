import { CopyButton } from '@tahti-player/ui';

import type { DesktopServiceStore } from '../lib/desktopService';
import { SettingsToggle } from '../views/settings/SettingsFields';

/** Settings → Integrations in the desktop app: one service's on/off switch,
 * its address with a copy button, and why it could not start. */
export function DesktopServiceRow({
  store,
  testId,
  label,
  description,
  copyLabel,
  failure,
}: {
  store: DesktopServiceStore;
  testId: string;
  label: string;
  description: string;
  copyLabel?: string;
  failure: string;
}) {
  const { enabled, url, error, busy, setEnabled } = store();
  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <SettingsToggle
        label={label}
        description={description}
        value={enabled}
        disabled={busy}
        onChange={(next) => void setEnabled(next)}
      />
      {enabled && url ? (
        <div className="flex items-center gap-2">
          <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
            {url}
          </code>
          {copyLabel ? (
            <CopyButton
              text={url}
              aria-label={copyLabel}
              toastMessage="Copied."
            />
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {failure}: {error}
        </p>
      ) : null}
    </div>
  );
}
