import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@nuclearplayer/tailwind-config';
import '@nuclearplayer/themes';
import '@nuclearplayer/ui';

import { router } from './router';
import { useThemeStore } from './stores/themeStore';
import './styles.css';

useThemeStore.getState().init();

const el = document.getElementById('root');
if (!el) {
  throw new Error('#root missing');
}

createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
