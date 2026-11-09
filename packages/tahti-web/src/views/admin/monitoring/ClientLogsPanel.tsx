import { Trash2, Upload } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button, LogViewer } from '@tahti-player/ui';

import {
  clearClientLogs,
  clientLogScopes,
  serializeClientLogs,
  useClientLogs,
} from '../../../lib/clientLogs';

function exportLogs(text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tahti-web-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ClientLogsPanel() {
  const { t } = useTranslation('web');
  const logs = useClientLogs();
  const scopes = useMemo(() => clientLogScopes(logs), [logs]);

  return (
    <div className="flex h-[70vh] min-h-96 flex-col gap-4">
      <Alert tone="neutral">{t('settingsLogs.alert')}</Alert>
      <div className="min-h-0 flex-1">
        <LogViewer.Root
          logs={logs}
          scopes={scopes}
          onClear={clearClientLogs}
          onExport={() => exportLogs(serializeClientLogs(logs))}
          onOpenLogFolder={() => {}}
          labels={{ noLogsMessage: t('settingsLogs.noLogs') }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <LogViewer.SearchInput />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={clearClientLogs}>
                <Trash2 className="mr-1 size-4" aria-hidden />
                {t('settingsLogs.clear')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={logs.length === 0}
                onClick={() => exportLogs(serializeClientLogs(logs))}
              >
                <Upload className="mr-1 size-4" aria-hidden />
                {t('settingsLogs.export')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LogViewer.LevelFilter />
            <LogViewer.ScopeFilter />
            <LogViewer.EntryCount />
          </div>
          <LogViewer.VirtualizedList />
          <LogViewer.EntryDetailDialog />
        </LogViewer.Root>
      </div>
    </div>
  );
}
