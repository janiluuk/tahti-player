import { useTranslation } from '@tahti-player/i18n';

import { useDesktopDiscordStore } from '../lib/discord/presence';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: Discord Rich Presence. */
export function DiscordIntegrationRow() {
  const { t } = useTranslation('web');
  return (
    <DesktopServiceRow
      store={useDesktopDiscordStore}
      testId="integration-discord"
      label={t('discordIntegrationRow.discordRichPresence')}
      description={t('discordIntegrationRow.showsWhatYouReListening')}
      failure="Could not connect to Discord"
    />
  );
}
