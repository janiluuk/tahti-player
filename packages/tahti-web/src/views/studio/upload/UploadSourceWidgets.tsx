import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Card, CardGrid } from '@tahti-player/ui';

import type { ConnectionStatus, IntegrationId } from '../../../api/sources';
import { servicePluginsForCategory } from '../../../components/plugin-store/serviceCatalog';
import { ServiceCard } from '../../../components/plugin-store/ServiceCategory';
import { ConfigureDialogHost } from '../../../components/plugin-store/shared';
import { SourceServiceIcon } from '../../../components/SourceServiceIcon';
import {
  importSourcePlugins,
  type ImportSourcePlugin,
} from '../../../plugins/import-sources';

const IMPORT_PLUGINS = servicePluginsForCategory('import');

const configurePluginFor = (id: IntegrationId) =>
  IMPORT_PLUGINS.find(
    (plugin) =>
      plugin.id === id &&
      (plugin.action.kind === 'oauth' ||
        plugin.id === 'hearthis' ||
        plugin.id === 'spotify'),
  );

const OAUTH_IMPORT_UI = new Set<IntegrationId>(['soundcloud', 'google-drive']);

const UPLOAD_SOURCES = (importSourcePlugins as ImportSourcePlugin[]).filter(
  (source) =>
    source.id !== 'upload' &&
    source.id !== 'stash' &&
    source.capabilities.import &&
    (source.kind !== 'oauth' || OAUTH_IMPORT_UI.has(source.id)) &&
    (configurePluginFor(source.id) !== undefined ||
      Boolean(source.studioDeepLink)),
);

function sourceSubtitle(
  source: ImportSourcePlugin,
  status: ConnectionStatus | undefined,
  t: TFunction<'web'>,
): string {
  if (source.kind !== 'oauth') {
    return t('library.uploadSourceReady');
  }
  if (!status) {
    return t('library.uploadSourceChecking');
  }
  if (status.unavailable) {
    return t('library.uploadSourceUnavailable');
  }
  if (status.connected) {
    return t('library.uploadSourceConnected');
  }
  return status.configured
    ? t('library.uploadSourceNotConnected')
    : t('library.uploadSourceNotAvailable');
}

export function UploadSourceWidgets() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<
    Partial<Record<IntegrationId, ConnectionStatus>>
  >({});
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);
  const [statusTick, setStatusTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    for (const source of UPLOAD_SOURCES) {
      if (source.kind !== 'oauth') {
        continue;
      }
      void source
        .checkStatus()
        .then((result) => result.data)
        .catch(() => ({
          connected: false,
          configured: false,
          unavailable: true,
        }))
        .then((data) => {
          if (!cancelled) {
            setStatuses((current) => ({ ...current, [source.id]: data }));
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [statusTick]);

  const selectedPlugin = selectedId ? configurePluginFor(selectedId) : null;

  return (
    <section aria-labelledby="source-widgets-title">
      <h2
        id="source-widgets-title"
        className="text-foreground-secondary mb-3 text-xs font-semibold tracking-wide uppercase"
      >
        {t('library.uploadSourcesTitle')}
      </h2>
      <CardGrid className="grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        {UPLOAD_SOURCES.map((source) => {
          const status = statuses[source.id];
          return (
            <Card
              key={source.id}
              title={source.name}
              subtitle={sourceSubtitle(source, status, t)}
              image={<SourceServiceIcon id={source.id} />}
              className={
                source.kind === 'oauth' && !status?.connected
                  ? 'opacity-60 grayscale'
                  : undefined
              }
              onClick={() => {
                if (configurePluginFor(source.id)) {
                  setSelectedId(source.id);
                } else if (source.studioDeepLink) {
                  void navigate({ to: source.studioDeepLink });
                }
              }}
            />
          );
        })}
      </CardGrid>
      {selectedPlugin ? (
        <ConfigureDialogHost.Provider
          value={{
            onClose: () => {
              setSelectedId(null);
              setStatusTick((n) => n + 1);
            },
          }}
        >
          <ServiceCard plugin={selectedPlugin} />
        </ConfigureDialogHost.Provider>
      ) : null}
    </section>
  );
}
