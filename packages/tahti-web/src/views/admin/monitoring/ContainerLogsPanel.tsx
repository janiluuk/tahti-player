import { useCallback, useEffect, useState } from 'react';

import { Alert, LogViewer, type LogEntryData } from '@tahti-player/ui';

import {
  fetchAdminContainerLogs,
  type AdminLogEntry,
} from '../../../api/admin';
import { PageEmpty, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePolling } from '../../../hooks/usePolling';

const REFRESH_INTERVAL_MS = 15_000;

function scopeFor(service: string): string {
  const match = /^tahti-stack-([a-z0-9-]+?)(-\d+)?$/.exec(service);
  return match?.[1] ?? service;
}

function toLogEntry(entry: AdminLogEntry, index: number): LogEntryData {
  return {
    id: `${entry.timestampMs}-${index}`,
    timestamp: new Date(entry.timestampMs),
    level: 'info',
    target: entry.service,
    source: { type: 'core', scope: scopeFor(entry.service) },
    message: entry.line,
  };
}

type ContainerLogsPanelProps = {
  service?: string;
  title?: string;
  heightClassName?: string;
};

export function ContainerLogsPanel({
  service,
  title,
  heightClassName = 'h-[50vh]',
}: ContainerLogsPanelProps) {
  const [entries, setEntries] = useState<AdminLogEntry[]>([]);
  const [lokiReachable, setLokiReachable] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetchAdminContainerLogs({
      limit: 500,
      ...(service ? { service } : {}),
    });
    setEntries(res.entries);
    setLokiReachable(res.lokiReachable);
    setLoading(false);
  }, [service]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);
  usePolling(() => {
    void load();
  }, REFRESH_INTERVAL_MS);

  const logs = entries.map(toLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();

  return (
    <StudioPanel title={title}>
      {!lokiReachable && (
        <Alert tone="error" className="mb-3">
          Could not reach the logging backend. It may be down, or this
          environment can&apos;t reach it on the LAN.
        </Alert>
      )}
      {loading ? (
        <PageLoading label="Loading logs…" />
      ) : logs.length === 0 ? (
        <PageEmpty title="No log lines in the last hour." />
      ) : (
        <div className={heightClassName}>
          <LogViewer.Root
            logs={logs}
            scopes={scopes}
            onClear={() => {}}
            onExport={() => {}}
            onOpenLogFolder={() => {}}
          >
            <div className="flex flex-wrap items-center gap-4">
              <LogViewer.SearchInput />
              <LogViewer.DateRangeFilter />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <LogViewer.ScopeFilter />
              <LogViewer.EntryCount />
            </div>
            <LogViewer.VirtualizedList />
            <LogViewer.EntryDetailDialog />
          </LogViewer.Root>
        </div>
      )}
    </StudioPanel>
  );
}
