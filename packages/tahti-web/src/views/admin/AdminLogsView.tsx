import { useSearch } from '@tanstack/react-router';
import {
  ActivityIcon,
  ContainerIcon,
  ExternalLinkIcon,
  HistoryIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ButtonAnchor,
  LogViewer,
  Tabs,
  ViewShell,
  type LogEntryData,
} from '@tahti-player/ui';

import { fetchAdminDashboard, type AdminAuditRow } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import {
  GRAFANA_DASHBOARDS,
  grafanaDashboardUrl,
  grafanaExploreLogsUrl,
} from '../../lib/grafanaMonitoring';
import { AdminActivityView } from './AdminActivityView';
import { ContainerLogsPanel } from './monitoring/ContainerLogsPanel';

const TAB_IDS = ['activity', 'containers', 'recent-audit'] as const;
type LogsTabId = (typeof TAB_IDS)[number];

const LOGS_TAB_LABELS: Record<LogsTabId, string> = {
  activity: 'Audit events',
  containers: 'Container logs',
  'recent-audit': 'Recent audit',
};

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchAdminDashboard().then((result) => {
      setEntries(result.data.audit);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, [attempt]);

  const logs = entries.map(toAuditLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();

  return (
    <StudioPanel title="Recent audit entries">
      {loading ? (
        <PageLoading label="Loading recent audit entries…" />
      ) : loadError && entries.length === 0 ? (
        <PageError
          title="Could not load recent audit entries"
          description={loadError}
          onRetry={() => {
            setLoading(true);
            setAttempt((n) => n + 1);
          }}
        />
      ) : entries.length === 0 ? (
        <PageEmpty title="No recent audit entries." />
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

function parseLogsTab(
  tab: string | undefined,
  service: string | undefined,
): LogsTabId {
  if (tab === 'containers' || tab === 'recent-audit' || tab === 'activity') {
    return tab;
  }
  if (service) {
    return 'containers';
  }
  return 'activity';
}

export function AdminLogsView() {
  const search = useSearch({ strict: false }) as {
    tab?: string;
    service?: string;
  };
  const initialTab = parseLogsTab(search.tab, search.service);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    TAB_IDS.indexOf(initialTab),
  );

  useEffect(() => {
    setSelectedIndex(TAB_IDS.indexOf(parseLogsTab(search.tab, search.service)));
  }, [search.tab, search.service]);

  const containerLogs = useMemo(
    () => (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <ButtonAnchor
            href={grafanaExploreLogsUrl(search.service)}
            target="_blank"
            rel="noreferrer"
            size="sm"
            variant="secondary"
          >
            Open in Grafana Explore
            <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
          </ButtonAnchor>
          <ButtonAnchor
            href={grafanaDashboardUrl(GRAFANA_DASHBOARDS.docker.uid)}
            target="_blank"
            rel="noreferrer"
            size="sm"
            variant="text"
          >
            Docker metrics
            <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
          </ButtonAnchor>
        </div>
        {search.service ? (
          <Alert tone="neutral">
            Filtering container logs for “{search.service}”.
          </Alert>
        ) : null}
        <ContainerLogsPanel
          service={search.service}
          heightClassName="h-[70vh]"
        />
      </div>
    ),
    [search.service],
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/logs">
          <div className="flex max-w-6xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
              <BreadcrumbLink to="/admin/logs">Logs</BreadcrumbLink>
              <BreadcrumbCurrent>
                {LOGS_TAB_LABELS[TAB_IDS[selectedIndex] ?? 'activity']}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title="Logs"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <Tabs
                selectedIndex={selectedIndex}
                onChange={setSelectedIndex}
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
