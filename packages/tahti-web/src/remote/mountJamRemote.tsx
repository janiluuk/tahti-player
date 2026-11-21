import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { applyLocale, browserLocale } from '../lib/locale';
import { createJamClient, readPairingToken } from './jamClient';
import { JamRemote } from './JamRemote';

/** Mounts the phone remote served by the desktop app's Tahti Jam server at
 * `/remote`, in the phone's language. A failed Finnish chunk fetch leaves it
 * in English rather than blocking the mount. */
export async function mountJamRemote(root: HTMLElement): Promise<void> {
  await applyLocale(browserLocale()).catch(() => {});
  const token = readPairingToken();
  createRoot(root).render(
    <StrictMode>
      <JamRemote client={token ? createJamClient(token) : null} />
    </StrictMode>,
  );
}
