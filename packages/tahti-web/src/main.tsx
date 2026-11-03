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
