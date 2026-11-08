import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { resetJamPairing, useDesktopJamStore } from '../lib/jam/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: Tahti Jam, the phone remote on your network. */
export function JamIntegrationRow() {
  const { t } = useTranslation('web');
  const url = useDesktopJamStore((state) => state.url);
  const [resetting, setResetting] = useState(false);
  return (
    <DesktopServiceRow
      store={useDesktopJamStore}
      testId="integration-jam"
      label={t('jamRow.tahtiJam')}
      description={t('jamRow.controlThePlayerFromA')}
      copyLabel="Copy Tahti Jam link"
      failure="Tahti Jam could not start"
    >
      {url ? (
        <div className="flex flex-col items-start gap-3">
          <div className="flex w-fit rounded-lg bg-white p-3">
            <QRCodeSVG
              value={url}
              size={176}
              level="M"
              includeMargin
              aria-label={t('jamRow.tahtiJamPairingQrCode')}
            />
          </div>
          <p className="text-foreground-secondary text-sm">
            {t('jamRow.anyoneWithThisLinkCan')}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={resetting}
            onClick={() => {
              setResetting(true);
              void resetJamPairing().finally(() => setResetting(false));
            }}
          >
            {t('jamRow.newPairingLink')}
          </Button>
        </div>
      ) : null}
    </DesktopServiceRow>
  );
}
