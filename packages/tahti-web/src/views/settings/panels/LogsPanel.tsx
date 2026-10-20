import { Trash2, Upload } from 'lucide-react';
import { useMemo } from 'react';

import { Alert, Button, ButtonLink, LogViewer } from '@tahti-player/ui';

import {
  clearClientLogs,
  clientLogScopes,
  serializeClientLogs,
  useClientLogs,
} from '../../../lib/clientLogs';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';

const LABELS = {
  noLogsMessage:
    'No log entries yet. Warnings, errors and player events from this tab show up here.',
};

function exportLogs(text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tahti-web-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Board-only: client-side log buffer for this tab, plus links to server logs. */
export function LogsPanel() {
  const logs = useClientLogs();
  const scopes = useMemo(() => clientLogScopes(logs), [logs]);
  const closeSettings = useSettingsModalStore((s) => s.close);

  return (
    <div className="flex h-[calc(100dvh-20rem)] min-h-96 flex-col gap-4">
      <Alert tone="neutral">
        These are browser-tab client logs only. For production container logs
        and Grafana vitals, open Admin.
      </Alert>
      <div className="flex flex-wrap gap-2">
        <ButtonLink
          to="/admin/logs"
          search={{ tab: 'containers' }}
          size="sm"
          onClick={() => closeSettings()}
        >
          Container logs
        </ButtonLink>
        <ButtonLink
          to="/admin/monitoring"
          size="sm"
          variant="secondary"
          onClick={() => closeSettings()}
        >
          Monitoring hub
        </ButtonLink>
      </div>
      <div className="min-h-0 flex-1">
        <LogViewer.Root
          logs={logs}
          scopes={scopes}
          onClear={clearClientLogs}
          onExport={() => exportLogs(serializeClientLogs(logs))}
          onOpenLogFolder={() => {}}
          labels={LABELS}
        >
          <div className="flex flex-wrap items-center gap-2">
            <LogViewer.SearchInput />
            <div className="flex gap-2">
              <Button size="sm" onClick={clearClientLogs}>
                <Trash2 className="mr-1 size-4" aria-hidden />
                Clear
              </Button>
              <Button
                size="sm"
                disabled={logs.length === 0}
                onClick={() => exportLogs(serializeClientLogs(logs))}
              >
                <Upload className="mr-1 size-4" aria-hidden />
                Export
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
