import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

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

/** Sources the upload page can do something with: a configure dialog, or a
 * Studio page to go to. Sources with neither are left out, not shown as a
 * card that leads nowhere. */
const UPLOAD_SOURCES = (importSourcePlugins as ImportSourcePlugin[]).filter(
  (source) =>
    source.id !== 'upload' &&
    source.id !== 'stash' &&
    (configurePluginFor(source.id) !== undefined ||
      Boolean(source.studioDeepLink)),
);

function sourceSubtitle(
  source: ImportSourcePlugin,
  status: ConnectionStatus | undefined,
): string {
  if (source.kind !== 'oauth') {
    return 'Ready';
  }
  if (!status) {
    return 'Checking…';
  }
  if (status.unavailable) {
    return 'Status unavailable';
  }
  if (status.connected) {
    return 'Connected';
  }
  return status.configured ? 'Not connected' : 'Not available yet';
}

export function UploadSourceWidgets() {
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
        Import sources
      </h2>
      <CardGrid className="grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        {UPLOAD_SOURCES.map((source) => {
          const status = statuses[source.id];
          return (
            <Card
              key={source.id}
              title={source.name}
              subtitle={sourceSubtitle(source, status)}
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
