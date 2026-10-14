import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { resetJamPairing, useDesktopJamStore } from '../lib/jam/desktop';
import { DesktopServiceRow } from './DesktopServiceRow';

/** Settings → Integrations in the desktop app: Tahti Jam, the phone remote on your network. */
export function JamIntegrationRow() {
  const url = useDesktopJamStore((state) => state.url);
  const [resetting, setResetting] = useState(false);
  return (
    <DesktopServiceRow
      store={useDesktopJamStore}
      testId="integration-jam"
      label="Tahti Jam"
      description="Control the player from a phone or another computer on your network. Scan the code to pair a device; only paired devices can control it."
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
              aria-label="Tahti Jam pairing QR code"
            />
          </div>
          <p className="text-foreground-secondary text-sm">
            Anyone with this link can control the player. A new link unpairs
            every device paired before.
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
            New pairing link
          </Button>
        </div>
      ) : null}
    </DesktopServiceRow>
  );
}
