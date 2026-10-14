import { useDesktopMpdStore } from '../lib/mpd/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: the local MPD server for MPD clients. */
export function MpdIntegrationRow() {
  return (
    <DesktopServiceRow
      store={useDesktopMpdStore}
      testId="integration-mpd"
      label="MPD server"
      description="Lets an MPD client such as mpc, ncmpcpp or a phone app control playback and the queue. It listens on this computer only."
      copyLabel="Copy MPD server address"
      failure="The MPD server could not start"
    />
  );
}
