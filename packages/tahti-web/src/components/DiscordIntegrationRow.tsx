import { useDesktopDiscordStore } from '../lib/discord/presence';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: Discord Rich Presence. */
export function DiscordIntegrationRow() {
  return (
    <DesktopServiceRow
      store={useDesktopDiscordStore}
      testId="integration-discord"
      label="Discord Rich Presence"
      description="Shows what you're listening to on your Discord profile. Discord has to be running on this computer."
      failure="Could not connect to Discord"
    />
  );
}
