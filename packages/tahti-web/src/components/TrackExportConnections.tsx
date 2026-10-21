import { SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonAnchor, Dialog, PluginItem } from '@tahti-player/ui';

import {
  fetchConnectionStatus,
  oauthStartUrl,
  SOURCE_DEFS,
  type ConnectionStatus,
  type IntegrationId,
} from '../api/sources';

// Export targets that actually have a connect/disconnect lifecycle to test
// and enable — the rest of EXPORT_TARGETS (Spotify, Apple Music,
// Deezer, Amazon Music, YouTube Music) deliver through Revelator release
// submission, with no per-account connection to configure here, and
// hearthis.at has no push API at all (cross-post is manual). Keeping this
// list to providers with a real oauthStartPath avoids offering a "test
// connection" button that has nothing to actually test.
const EXPORT_CONNECTION_IDS: IntegrationId[] = [
  'bandcamp',
  'soundcloud',
  'mixcloud',
];

const EXPORT_SOURCES = SOURCE_DEFS.filter((source) =>
  EXPORT_CONNECTION_IDS.includes(source.id),
);

function ConnectionConfigureDialog({
  sourceId,
  name,
  oauthStartPath,
  onClose,
}: {
  sourceId: IntegrationId;
  name: string;
  oauthStartPath: string | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [testing, setTesting] = useState(false);

  const test = () => {
    setTesting(true);
    void fetchConnectionStatus(sourceId).then(({ data }) => {
      setStatus(data);
      setTesting(false);
    });
  };

  useEffect(test, [sourceId]);

  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-md">
      <Dialog.Title>Configure {name}</Dialog.Title>
      <Dialog.Description>
        Test the connection, then enable it by connecting your account.
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span>
            {testing
              ? 'Testing connection…'
              : status?.connected
                ? `Connected${status.username ? ` as ${status.username}` : ''}`
                : 'Not connected'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={test}
            disabled={testing}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </Button>
        </div>
        {status?.connected ? (
          <p className="text-foreground-secondary text-xs">
            Already enabled — tracks can be sent to {name} from here once export
            support for this provider ships.
          </p>
        ) : oauthStartPath ? (
          <ButtonAnchor href={oauthStartUrl(oauthStartPath)} className="w-full">
            Connect {name} to enable
          </ButtonAnchor>
        ) : (
          <p className="text-foreground-secondary text-xs">
            This provider doesn&apos;t support connecting yet.
          </p>
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

/** Connect/disconnect status for the export-adjacent connected accounts
 * (Bandcamp, SoundCloud, Mixcloud) — the DSP-delivery targets in
 * EXPORT_TARGETS go through Revelator release submission instead and have
 * no per-account connection to test here. */
export function TrackExportConnections() {
  const [statuses, setStatuses] = useState<
    Partial<Record<IntegrationId, ConnectionStatus>>
  >({});
  const [configuring, setConfiguring] = useState<IntegrationId | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      EXPORT_SOURCES.map((source) =>
        fetchConnectionStatus(source.id).then(
          ({ data }) => [source.id, data] as const,
        ),
      ),
    ).then((entries) => {
      if (!cancelled) {
        setStatuses(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const configuringSource = EXPORT_SOURCES.find(
    (source) => source.id === configuring,
  );

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        Connected accounts
      </h3>
      <ul className="flex flex-col gap-2">
        {EXPORT_SOURCES.map((source) => {
          const status = statuses[source.id];
          const active = status?.connected ?? false;
          return (
            <PluginItem
              key={source.id}
              icon={<SettingsIcon size={20} aria-hidden />}
              name={source.name}
              author="Export"
              description={
                active
                  ? `Active${status?.username ? ` · ${status.username}` : ''}`
                  : 'Inactive — needs configuring'
              }
              onViewDetails={() => setConfiguring(source.id)}
            />
          );
        })}
      </ul>
      {configuringSource ? (
        <ConnectionConfigureDialog
          sourceId={configuringSource.id}
          name={configuringSource.name}
          oauthStartPath={configuringSource.oauthStartPath}
          onClose={() => {
            setConfiguring(null);
            // Refresh in case the dialog's own test/connect changed it.
            void fetchConnectionStatus(configuringSource.id).then(({ data }) =>
              setStatuses((current) => ({
                ...current,
                [configuringSource.id]: data,
              })),
            );
          }}
        />
      ) : null}
    </div>
  );
}
