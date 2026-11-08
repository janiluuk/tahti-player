import { useTranslation } from '@tahti-player/i18n';

import { useDesktopMcpStore } from '../lib/mcp/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: the local MCP server for AI tools. */
export function McpIntegrationRow() {
  const { t } = useTranslation('web');
  return (
    <DesktopServiceRow
      store={useDesktopMcpStore}
      testId="integration-mcp"
      label={t('mcpIntegrationRow.mcpServer')}
      description={t('mcpIntegrationRow.letsAnAiToolSuch')}
      copyLabel="Copy MCP server URL"
      failure="The MCP server could not start"
    />
  );
}
