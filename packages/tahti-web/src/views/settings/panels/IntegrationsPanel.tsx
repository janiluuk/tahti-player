import { useTranslation } from '@tahti-player/i18n';
import { SectionShell } from '@tahti-player/ui';

import { DesktopUpdatesRow } from '../../../components/DesktopUpdatesRow';
import { DiscordIntegrationRow } from '../../../components/DiscordIntegrationRow';
import { JamIntegrationRow } from '../../../components/JamIntegrationRow';
import { McpIntegrationRow } from '../../../components/McpIntegrationRow';
import { MpdIntegrationRow } from '../../../components/MpdIntegrationRow';
import { getNativeDiscord } from '../../../lib/discord/presence';
import { getNativeJam } from '../../../lib/jam/desktop';
import { getNativeMcp } from '../../../lib/mcp/desktop';
import { getNativeMpd } from '../../../lib/mpd/desktop';
import { getNativeUpdater } from '../../../lib/updates/desktopUpdates';
import { LastFmIntegrationRow } from '../../../plugins/scrobble/LastFmIntegrationRow';
import { ListenBrainzIntegrationRow } from '../../../plugins/scrobble/ListenBrainzIntegrationRow';

export function IntegrationsPanel() {
  const { t } = useTranslation('web');
  const nativeMcp = getNativeMcp() !== null;
  const nativeMpd = getNativeMpd() !== null;
  const nativeDiscord = getNativeDiscord() !== null;
  const nativeJam = getNativeJam() !== null;
  const nativeUpdater = getNativeUpdater() !== null;
  const hasDesktopIntegrations =
    nativeUpdater || nativeJam || nativeMcp || nativeMpd || nativeDiscord;
  return (
    <div
      className="flex w-full max-w-xl flex-col"
      data-testid="integrations-panel"
    >
      <SectionShell title={t('settingsIntegrations.scrobbling')}>
        <div className="flex flex-col gap-6">
          <ListenBrainzIntegrationRow />
          <LastFmIntegrationRow />
        </div>
      </SectionShell>
      {hasDesktopIntegrations ? (
        <SectionShell
          title={t('settingsIntegrations.desktopApp')}
          className="border-border border-t pt-6"
          data-testid="integrations-desktop-only"
        >
          <div className="flex flex-col gap-6">
            {nativeUpdater ? <DesktopUpdatesRow /> : null}
            {nativeJam ? <JamIntegrationRow /> : null}
            {nativeMcp ? <McpIntegrationRow /> : null}
            {nativeMpd ? <MpdIntegrationRow /> : null}
            {nativeDiscord ? <DiscordIntegrationRow /> : null}
          </div>
        </SectionShell>
      ) : null}
    </div>
  );
}
