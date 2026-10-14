import '@tahti-player/tailwind-config';
import '@tahti-player/themes';

import { mountJamRemote } from '../../tahti-web/src/remote/mountJamRemote';

import '../../tahti-web/src/styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root missing');
}
mountJamRemote(rootElement);
