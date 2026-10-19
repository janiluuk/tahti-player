/**
 * Grafana on vimage6 — public URL and dashboard UIDs from
 * tahti-org/ops/monitoring/vimage6/README.md.
 */

export const GRAFANA_BASE_URL =
  import.meta.env.VITE_GRAFANA_URL?.replace(/\/$/, '') ||
  'https://grafana.tahti.live';

export type GrafanaDashboard = {
  uid: string;
  title: string;
  description: string;
};

export const GRAFANA_DASHBOARDS = {
  vital: {
    uid: 'tahti-vital-services',
    title: 'Vital services',
    description: 'API health, dependencies, and blackbox probes.',
  },
  overview: {
    uid: 'tahti-overview',
    title: 'Lab overview',
    description: 'App metrics, users, Stripe, storage, tracks, registrations.',
  },
  infrastructure: {
    uid: 'tahti-infrastructure',
    title: 'Infrastructure',
    description: 'Hosts, CPU, memory, disk, containers, and public probes.',
  },
  docker: {
    uid: 'vimage-docker-os-metrics',
    title: 'Docker & OS',
    description: 'Per-container CPU/memory/network on the lab host.',
  },
} as const satisfies Record<string, GrafanaDashboard>;

export type MonitoringService = {
  id: string;
  label: string;
  /** Substring matched against Loki `service` / container name. */
  logService: string;
  grafana: {
    dashboard: keyof typeof GRAFANA_DASHBOARDS;
    note?: string;
  };
  description: string;
};

export const MONITORING_SERVICES: MonitoringService[] = [
  {
    id: 'api',
    label: 'API',
    logService: 'api',
    grafana: { dashboard: 'vital', note: 'API healthy + dependency gauges' },
    description: 'Fastify API health and dependency checks.',
  },
  {
    id: 'web',
    label: 'Web / beta',
    logService: 'web',
    grafana: { dashboard: 'vital', note: 'Blackbox probe for the app' },
    description: 'Listener SPA and beta.tahti.live reachability.',
  },
  {
    id: 'worker',
    label: 'Workers',
    logService: 'worker',
    grafana: { dashboard: 'docker', note: 'Container CPU / memory' },
    description: 'Background jobs (transcode, payouts, mail).',
  },
  {
    id: 'chat',
    label: 'Chat (Centrifugo)',
    logService: 'chat',
    grafana: { dashboard: 'vital', note: 'Centrifugo probe' },
    description: 'Realtime chat gateway.',
  },
  {
    id: 'icecast',
    label: 'Icecast / Liquidsoap',
    logService: 'icecast',
    grafana: { dashboard: 'vital', note: 'Icecast probe + dependency' },
    description: 'Radio ingest and station mounts.',
  },
  {
    id: 'minio',
    label: 'MinIO',
    logService: 'minio',
    grafana: { dashboard: 'vital', note: 'Storage live probe' },
    description: 'Object storage for media and artwork.',
  },
  {
    id: 'postgres',
    label: 'Postgres',
    logService: 'postgres',
    grafana: { dashboard: 'infrastructure', note: 'Host + backup alerts' },
    description: 'Primary database and backup age alerts.',
  },
  {
    id: 'redis',
    label: 'Redis',
    logService: 'redis',
    grafana: {
      dashboard: 'infrastructure',
      note: 'Queue / cache host metrics',
    },
    description: 'Queues and cache.',
  },
];

function withQuery(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      qs.set(key, value);
    }
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

export function grafanaDashboardUrl(
  uid: string,
  opts: { kiosk?: boolean; from?: string; to?: string } = {},
): string {
  return withQuery(`${GRAFANA_BASE_URL}/d/${uid}`, {
    orgId: '1',
    from: opts.from ?? 'now-6h',
    to: opts.to ?? 'now',
    ...(opts.kiosk ? { kiosk: 'tv', theme: 'dark' } : {}),
  });
}

export function grafanaDashboardEmbedUrl(uid: string): string {
  return grafanaDashboardUrl(uid, { kiosk: true });
}

/** Grafana Explore with LogQL for the Tahti Loki job (datasource resolved by name). */
export function grafanaExploreLogsUrl(serviceFilter?: string): string {
  const expr = serviceFilter
    ? `{job="tahti", service=~".*${serviceFilter}.*"}`
    : '{job="tahti"}';
  const left = {
    datasource: 'Loki',
    queries: [
      {
        refId: 'A',
        expr,
        queryType: 'range',
      },
    ],
    range: { from: 'now-1h', to: 'now' },
  };
  return withQuery(`${GRAFANA_BASE_URL}/explore`, {
    orgId: '1',
    left: JSON.stringify(left),
  });
}

export function adminLogsHref(service?: string): string {
  return withQuery('/admin/logs', {
    tab: 'containers',
    ...(service ? { service } : {}),
  });
}
