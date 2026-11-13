import { i18n, useTranslation } from '@tahti-player/i18n';

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
      copyLabel={i18n.t('web:batch51.copyMpdAddress')}
      failure={i18n.t('web:batch51.mpdCouldNotStart')}
    />
  );
}
