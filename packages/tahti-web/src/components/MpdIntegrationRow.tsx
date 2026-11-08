import { useTranslation } from '@tahti-player/i18n';

import { useDesktopMpdStore } from '../lib/mpd/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: the local MPD server for MPD clients. */
export function MpdIntegrationRow() {
  const { t } = useTranslation('web');
  return (
    <DesktopServiceRow
      store={useDesktopMpdStore}
      testId="integration-mpd"
      label={t('mpdIntegrationRow.mpdServer')}
      description={t('mpdIntegrationRow.letsAnMpdClientSuch')}
      copyLabel="Copy MPD server address"
      failure="The MPD server could not start"
    />
  );
}
