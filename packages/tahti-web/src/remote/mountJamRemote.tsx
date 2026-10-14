import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createJamClient, readPairingToken } from './jamClient';
import { JamRemote } from './JamRemote';

/** Mounts the phone remote served by the desktop app's Tahti Jam server at `/remote`. */
export function mountJamRemote(root: HTMLElement): void {
  const token = readPairingToken();
  createRoot(root).render(
    <StrictMode>
      <JamRemote client={token ? createJamClient(token) : null} />
    </StrictMode>,
  );
}
