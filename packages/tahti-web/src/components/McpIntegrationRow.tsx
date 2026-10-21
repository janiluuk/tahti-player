import { useDesktopMcpStore } from '../lib/mcp/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: the local MCP server for AI tools. */
export function McpIntegrationRow() {
  return (
    <DesktopServiceRow
      store={useDesktopMcpStore}
      testId="integration-mcp"
      label="MCP server"
      description="Lets an AI tool such as Claude Code or Cursor control playback, the queue, your library and radio. It listens on this computer only."
      copyLabel="Copy MCP server URL"
      failure="The MCP server could not start"
    />
  );
}
