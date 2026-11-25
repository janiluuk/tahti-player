import '@tahti-player/tailwind-config';
import '@tahti-player/themes';
import '@tahti-player/ui';
import './styles.css';

import { applySubdomainEntry } from './lib/channelSubdomain';

applySubdomainEntry(window);

const el = document.getElementById('root');
if (!el) {
  throw new Error('#root missing');
}

const [{ mountTahtiApp }] = await Promise.all([
  import('./TahtiApp'),
  import('./stores/languageStore').then((module) =>
    module.applyStoredLanguage(),
  ),
]);
void mountTahtiApp(el);

// Both conditions are build-time constants, so production builds drop the
// hooks module entirely.
if (import.meta.env.DEV || import.meta.env.MODE === 'e2e-mock') {
  void import('./e2e/testHooks').then((module) =>
    module.installE2eHooks(window),
  );
}
