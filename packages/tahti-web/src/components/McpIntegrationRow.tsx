import { i18n, useTranslation } from '@tahti-player/i18n';

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
      copyLabel={i18n.t('web:batch51.copyMcpUrl')}
      failure={i18n.t('web:batch51.mcpCouldNotStart')}
    />
  );
}
