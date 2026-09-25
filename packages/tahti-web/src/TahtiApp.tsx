import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { startClientLogEvents } from './lib/clientLogEvents';
import { installClientLogCapture, logClientEvent } from './lib/clientLogs';
import { startLocalPlayCounting } from './lib/playCounting';
import { startPlayerPrefsPersistence } from './lib/playerPrefsPersistence';
import {
  restorePersistedQueue,
  startQueuePersistence,
} from './lib/queuePersistence';
import { useThemeStore } from './plugins/themes';
import { router } from './router';
import { usePlayerStore } from './stores/playerStore';

export function TahtiApp() {
  return <RouterProvider router={router} />;
}

export async function mountTahtiApp(rootElement: HTMLElement) {
  installClientLogCapture();
  logClientEvent('info', 'app', `Tahti web ${__APP_VERSION__} starting`);
  await useThemeStore.persist.rehydrate();
  useThemeStore.getState().init();
  if (restorePersistedQueue()) {
    const { queue } = usePlayerStore.getState();
    logClientEvent('info', 'queue', `Restored ${queue.length} items from disk`);
  }
  startQueuePersistence();
  startPlayerPrefsPersistence();
  startClientLogEvents();
  startLocalPlayCounting();
  createRoot(rootElement).render(
    <StrictMode>
      <TahtiApp />
    </StrictMode>,
  );
}
