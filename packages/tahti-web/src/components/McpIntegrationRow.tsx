import { CopyButton } from '@tahti-player/ui';

import { useDesktopMcpStore } from '../lib/mcp/desktop';
import { SettingsToggle } from '../views/settings/SettingsFields';

/** Settings → Integrations in the desktop app: the local MCP server for AI tools. */
export function McpIntegrationRow() {
  const { enabled, url, error, busy, setEnabled } = useDesktopMcpStore();
  return (
    <div className="flex flex-col gap-2" data-testid="integration-mcp">
      <SettingsToggle
        label="MCP server"
        description="Lets an AI tool such as Claude Code or Cursor control playback, the queue, your library and radio. It listens on this computer only."
        value={enabled}
        disabled={busy}
        onChange={(next) => void setEnabled(next)}
      />
      {enabled && url ? (
        <div className="flex items-center gap-2">
          <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
            {url}
          </code>
          <CopyButton
            text={url}
            aria-label="Copy MCP server URL"
            toastMessage="URL copied."
          />
        </div>
      ) : null}
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          The MCP server could not start: {error}
        </p>
      ) : null}
    </div>
  );
}
