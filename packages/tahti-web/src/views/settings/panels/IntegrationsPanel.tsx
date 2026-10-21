import { useCallback, useEffect, useState } from 'react';

import { Badge, SectionShell } from '@tahti-player/ui';

import { fetchMeIntegrations } from '../../../api/integrations';
import { DesktopUpdatesRow } from '../../../components/DesktopUpdatesRow';
import { DiscordIntegrationRow } from '../../../components/DiscordIntegrationRow';
import { JamIntegrationRow } from '../../../components/JamIntegrationRow';
import { McpIntegrationRow } from '../../../components/McpIntegrationRow';
import { MpdIntegrationRow } from '../../../components/MpdIntegrationRow';
import { PageError } from '../../../components/PageStates';
import { getNativeDiscord } from '../../../lib/discord/presence';
import { getNativeJam } from '../../../lib/jam/desktop';
import { getNativeMcp } from '../../../lib/mcp/desktop';
import { getNativeMpd } from '../../../lib/mpd/desktop';
import { getNativeUpdater } from '../../../lib/updates/desktopUpdates';
import { LastFmIntegrationRow } from '../../../plugins/scrobble/LastFmIntegrationRow';
import { ListenBrainzIntegrationRow } from '../../../plugins/scrobble/ListenBrainzIntegrationRow';

/** Nuclear desktop `integrations` settings that run local servers or talk to
 * local desktop apps; the web client has no API for them. */
const DESKTOP_ONLY_INTEGRATIONS = [
  {
    id: 'jam',
    label: 'Tahti Jam',
    description:
      'Start a local web server that lets you control the player from other devices on your network.',
  },
  {
    id: 'mcp',
    label: 'MCP Server',
    description:
      'Start a local MCP server that allows AI tools to control the player.',
  },
  {
    id: 'mpd',
    label: 'MPD Server',
    description:
      'Start a local MPD-compatible server so MPD clients can control the player.',
  },
  {
    id: 'discord',
    label: 'Discord Rich Presence',
    description: "Show what you're listening to on your Discord profile.",
  },
] as const;

export function IntegrationsPanel() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const reloadIntegrations = useCallback(() => {
    setLoadError(null);
    void fetchMeIntegrations().catch((err) => {
      setLoadError(
        err instanceof Error ? err.message : 'Could not load integrations.',
      );
    });
  }, []);

  useEffect(() => {
    reloadIntegrations();
  }, [reloadIntegrations]);

  const nativeMcp = getNativeMcp() !== null;
  const nativeMpd = getNativeMpd() !== null;
  const nativeDiscord = getNativeDiscord() !== null;
  const nativeJam = getNativeJam() !== null;
  const nativeUpdater = getNativeUpdater() !== null;
  const desktopOnly = DESKTOP_ONLY_INTEGRATIONS.filter(
    (item) =>
      !(nativeMcp && item.id === 'mcp') &&
      !(nativeMpd && item.id === 'mpd') &&
      !(nativeDiscord && item.id === 'discord') &&
      !(nativeJam && item.id === 'jam'),
  );
  return (
    <div
      className="flex w-full max-w-xl flex-col"
      data-testid="integrations-panel"
    >
      <SectionShell title="Scrobbling">
        <div className="flex flex-col gap-6">
          {loadError ? (
            <PageError
              title="Couldn't load integrations"
              description={loadError}
              onRetry={reloadIntegrations}
            />
          ) : null}
          <ListenBrainzIntegrationRow />
          <LastFmIntegrationRow />
        </div>
      </SectionShell>
      <SectionShell
        title="Desktop app"
        className="border-border border-t pt-6"
        data-testid="integrations-desktop-only"
      >
        <div className="flex flex-col gap-6">
          {nativeUpdater ? <DesktopUpdatesRow /> : null}
          {nativeJam ? <JamIntegrationRow /> : null}
          {nativeMcp ? <McpIntegrationRow /> : null}
          {nativeMpd ? <MpdIntegrationRow /> : null}
          {nativeDiscord ? <DiscordIntegrationRow /> : null}
          {desktopOnly.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-foreground text-sm font-semibold">
                  {item.label}
                </span>
                <Badge variant="pill" color="secondary">
                  Desktop app only
                </Badge>
              </div>
              <p className="text-foreground-secondary text-sm select-none">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
