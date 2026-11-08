import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  ViewShell,
} from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
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
      title={t('statusPage.status')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-4' }}
    >
      <PageBackLink to="/help" label={t('statusPage.helpCenter')} />
      {loading && <PageLoading label={t('loading.checking')} />}
      {!loading && !data && (
        <PageError
          title={t('loadErrors.couldNotLoadPlatformStatus')}
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
                <dt className="text-xs uppercase">{t('statusPage.version')}</dt>
                <dd className="text-foreground">{data.version}</dd>
              </div>
            )}
            {typeof data.uptimeSec === 'number' && (
              <div>
                <dt className="text-xs uppercase">{t('statusPage.uptime')}</dt>
                <dd className="text-foreground">
                  {Math.floor(data.uptimeSec / 60)} min
                </dd>
              </div>
            )}
            {data.ts && (
              <div>
                <dt className="text-xs uppercase">{t('statusPage.checked')}</dt>
                <dd className="text-foreground">
                  {new Date(data.ts).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
          {Object.keys(data.checks).length === 0 ? (
            <PageError
              title={t('loadErrors.noHealthChecksReported')}
              description={t('loadErrors.theApiDidNotAnswer')}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : (
            <>
              <DataTable>
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell>
                      {t('statusPage.check')}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      {t('statusPage.state')}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      {t('statusPage.latency')}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      {t('statusPage.detail')}
                    </DataTableHeaderCell>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {Object.entries(data.checks).map(([id, check]) => (
                    <DataTableRow key={id}>
                      <DataTableCell className="font-medium">
                        {id}
                        {check.critical ? ' *' : ''}
                      </DataTableCell>
                      <DataTableCell
                        className={`py-2 pr-3 ${stateClass(check.state)}`}
                      >
                        {check.state}
                      </DataTableCell>
                      <DataTableCell className="text-foreground-secondary">
                        {typeof check.latencyMs === 'number'
                          ? `${check.latencyMs} ms`
                          : '—'}
                      </DataTableCell>
                      <DataTableCell className="text-foreground-secondary text-xs">
                        {check.detail ?? ''}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
              <p className="text-foreground-secondary text-xs">
                * Critical dependency
              </p>
            </>
          )}
        </>
      )}

      <dl className="text-foreground-secondary border-border grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase">{t('statusPage.clientVersion')}</dt>
          <dd className="text-foreground">{__APP_VERSION__.split('+')[0]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase">{t('statusPage.tagged')}</dt>
          <dd className="text-foreground">
            {new Date(__RELEASE_TAG_DATE__).toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase">{t('statusPage.deployed')}</dt>
          <dd className="text-foreground">
            {new Date(__BUILD_TIME__).toLocaleString()}
          </dd>
        </div>
      </dl>
    </ViewShell>
  );
}
