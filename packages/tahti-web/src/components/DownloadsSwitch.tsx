import { Toggle } from '@tahti-player/ui';

/** Renders nothing while `enabled` is undefined: APIs older than
 * tahti-org#659 don't return the flag and would ignore a saved value. */
export function DownloadsSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean | undefined;
  onChange: (enabled: boolean) => void;
}) {
  if (enabled === undefined) {
    return null;
  }
  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span>
        <span className="block font-medium">Allow downloads</span>
        <span className="text-foreground-secondary block text-xs">
          Listeners can download the audio file. Turning this off keeps the
          track playable.
        </span>
      </span>
      <Toggle label="Allow downloads" checked={enabled} onChange={onChange} />
    </div>
  );
}
