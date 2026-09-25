import { Badge, SectionShell } from '@tahti-player/ui';

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
  return (
    <div
      className="flex w-full max-w-xl flex-col"
      data-testid="integrations-panel"
    >
      <SectionShell title="Scrobbling">
        <div className="flex flex-col gap-6">
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
          {DESKTOP_ONLY_INTEGRATIONS.map((item) => (
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
