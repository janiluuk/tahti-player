import { ClientCapabilityNotice } from './ClientCapabilityNotice';

/** The API has no per-track downloads flag yet: any public, ready track can
 * be downloaded, subject only to the follow/repost and access gates. */
export function DownloadsSwitchNotice() {
  return (
    <ClientCapabilityNotice kind="coming-soon" title="Turning downloads off">
      Listeners can download public tracks for now. You can still ask for a
      follow or repost first, or limit who can play the track.
    </ClientCapabilityNotice>
  );
}
