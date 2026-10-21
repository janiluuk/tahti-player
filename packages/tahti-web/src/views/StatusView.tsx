import { useEffect, useState } from 'react';

import { ViewShell } from '@tahti-player/ui';

import { fetchPlatformStatus } from '../api/client';
import type { PlatformStatus } from '../api/types';
import { PageBackLink } from '../components/PageBackLink';
import { PageError, PageLoading } from '../components/PageStates';

function stateClass(state: string): string {
  if (state === 'ok' || state === 'healthy') {
    return 'text-primary-strong';
  }
  if (state === 'degraded') {
    return 'text-foreground';
  }
  return 'text-accent-red-strong';
}

export function StatusView() {
  const [data, setData] = useState<PlatformStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPlatformStatus().then((res) => {
      if (cancelled) {
        return;
      }
      const reason =
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null;
      const unusable =
        reason !== null && Object.keys(res.data.checks).length === 0;
      setLoadError(unusable ? reason : null);
      setData(unusable ? null : res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <ViewShell
      title="Status"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-4' }}
    >
      <PageBackLink to="/help" label="Help center" />
      {loading && <PageLoading label="Checking…" />}
      {!loading && !data && (
        <PageError
          title="Could not load platform status"
          description={loadError ?? undefined}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}
      {!loading && data && (
        <>
          <p
            className={`font-display text-2xl font-bold ${stateClass(data.status)}`}
          >
            {data.status.toUpperCase()}
          </p>
          <dl className="text-foreground-secondary grid gap-2 text-sm sm:grid-cols-2">
            {data.version && (
              <div>
                <dt className="text-xs uppercase">Version</dt>
                <dd className="text-foreground">{data.version}</dd>
              </div>
            )}
            {typeof data.uptimeSec === 'number' && (
              <div>
                <dt className="text-xs uppercase">Uptime</dt>
                <dd className="text-foreground">
                  {Math.floor(data.uptimeSec / 60)} min
                </dd>
              </div>
            )}
            {data.ts && (
              <div>
                <dt className="text-xs uppercase">Checked</dt>
                <dd className="text-foreground">
                  {new Date(data.ts).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
          {Object.keys(data.checks).length === 0 ? (
            <PageError
              title="No health checks reported"
              description="The API did not answer."
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : (
            <>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
                    <th className="py-2 pr-3 font-medium">Check</th>
                    <th className="py-2 pr-3 font-medium">State</th>
                    <th className="py-2 pr-3 font-medium">Latency</th>
                    <th className="py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.checks).map(([id, check]) => (
                    <tr key={id} className="border-border border-b">
                      <td className="py-2 pr-3 font-medium">
                        {id}
                        {check.critical ? ' *' : ''}
                      </td>
                      <td className={`py-2 pr-3 ${stateClass(check.state)}`}>
                        {check.state}
                      </td>
                      <td className="text-foreground-secondary py-2 pr-3">
                        {typeof check.latencyMs === 'number'
                          ? `${check.latencyMs} ms`
                          : '—'}
                      </td>
                      <td className="text-foreground-secondary py-2 text-xs">
                        {check.detail ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-foreground-secondary text-xs">
                * Critical dependency
              </p>
            </>
          )}
        </>
      )}

      <dl className="text-foreground-secondary border-border grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase">Client version</dt>
          <dd className="text-foreground">{__APP_VERSION__.split('+')[0]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase">Tagged</dt>
          <dd className="text-foreground">
            {new Date(__RELEASE_TAG_DATE__).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase">Deployed</dt>
          <dd className="text-foreground">
            {new Date(__BUILD_TIME__).toLocaleString()}
          </dd>
        </div>
      </dl>
    </ViewShell>
  );
}
