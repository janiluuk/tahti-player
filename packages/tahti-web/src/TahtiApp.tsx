import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  restorePersistedQueue,
  startQueuePersistence,
} from './lib/queuePersistence';
import { useThemeStore } from './plugins/themes';
import { router } from './router';

export function TahtiApp() {
  return <RouterProvider router={router} />;
}

export async function mountTahtiApp(rootElement: HTMLElement) {
  await useThemeStore.persist.rehydrate();
  useThemeStore.getState().init();
  restorePersistedQueue();
  startQueuePersistence();
  createRoot(rootElement).render(
    <StrictMode>
      <TahtiApp />
    </StrictMode>,
  );
}
