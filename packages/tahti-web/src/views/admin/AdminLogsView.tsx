import { ActivityIcon, ContainerIcon, HistoryIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  LogViewer,
  Tabs,
  ViewShell,
  type LogEntryData,
} from '@tahti-player/ui';

import {
  fetchAdminContainerLogs,
  fetchAdminDashboard,
  type AdminAuditRow,
  type AdminLogEntry,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { usePolling } from '../../hooks/usePolling';
import { AdminActivityView } from './AdminActivityView';

const REFRESH_INTERVAL_MS = 15_000;

function toAuditLogEntry(entry: AdminAuditRow): LogEntryData {
  return {
    id: entry.id,
    timestamp: new Date(entry.createdAt),
    level: 'info',
    target: 'audit',
    source: { type: 'core', scope: entry.action },
    message: `Actor ${entry.actorId}`,
  };
}

function RecentAuditEntries() {
  const [entries, setEntries] = useState<AdminAuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminDashboard().then((result) => {
      setEntries(result.data.audit);
      setLoading(false);
    });
  }, []);

  const logs = entries.map(toAuditLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();

  return (
    <StudioPanel title="Recent audit entries">
      {loading ? (
        <PageLoading label="Loading recent audit entries…" />
      ) : entries.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No recent audit entries.
        </p>
      ) : (
        <div className="h-[50vh]">
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

// Container names carry the compose project prefix ("tahti-stack-api-1")
// — group by the middle segment so the ScopeFilter reads as service names
// instead of every entry being its own scope.
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

export function AdminLogsView() {
  const [entries, setEntries] = useState<AdminLogEntry[]>([]);
  const [lokiReachable, setLokiReachable] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetchAdminContainerLogs({ limit: 500 });
    setEntries(res.entries);
    setLokiReachable(res.lokiReachable);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  usePolling(() => {
    void load();
  }, REFRESH_INTERVAL_MS);

  const logs = entries.map(toLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();

  const containerLogs = (
    <StudioPanel>
      {!lokiReachable && (
        <Alert tone="error" className="mb-3">
          Could not reach the logging backend. It may be down, or this
          environment can&apos;t reach it on the LAN.
        </Alert>
      )}
      {loading ? (
        <PageLoading label="Loading logs…" />
      ) : logs.length === 0 ? (
        <p className="text-foreground-secondary py-4 text-center text-sm">
          No log lines in the last hour.
        </p>
      ) : (
        <div className="h-[70vh]">
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

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/logs">
          <div className="flex max-w-6xl flex-col gap-6">
            <ViewShell title="Logs" classes={{ root: 'px-0 pt-0' }}>
              <Tabs
                items={[
                  {
                    id: 'activity',
                    label: 'Audit events',
                    icon: <ActivityIcon size={14} />,
                    content: <AdminActivityView embedded />,
                  },
                  {
                    id: 'containers',
                    label: 'Container logs',
                    icon: <ContainerIcon size={14} />,
                    content: containerLogs,
                  },
                  {
                    id: 'recent-audit',
                    label: 'Recent audit',
                    icon: <HistoryIcon size={14} />,
                    content: <RecentAuditEntries />,
                  },
                ]}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
