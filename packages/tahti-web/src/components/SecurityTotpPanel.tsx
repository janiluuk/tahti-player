import {
  CheckIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  XIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { Button, Input, SectionShell } from '@tahti-player/ui';

import {
  confirmTotp,
  disableTotp,
  fetchTotpStatus,
  setupTotp,
} from '../api/security';
import { PageLoading } from './PageStates';

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

export function SecurityTotpPanel() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{
    secret: string;
    otpauthUri: string;
  } | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetchTotpStatus().then((r) => {
      setEnabled(r.data.enabled);
    });
  }, []);

  if (enabled === null) {
    return (
      <SectionShell title="Two-factor authentication">
        <PageLoading label="Loading two-factor authentication…" />
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Two-factor authentication">
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Status:{' '}
          <span className="font-medium">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </p>

        {backupCodes && (
          <div className="border-border rounded-lg border px-3 py-2">
            <p className="text-sm font-medium">Save these backup codes</p>
            <p className="text-foreground-secondary mt-1 text-xs">
              Shown once. Store them somewhere safe.
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => setBackupCodes(null)}
            >
              <CheckIcon size={15} aria-hidden className="mr-1.5" />
              Done
            </Button>
          </div>
        )}

        {!enabled && !setup && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              setPending(true);
              setError(null);
              void setupTotp().then((res) => {
                setPending(false);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setSetup({ secret: res.secret, otpauthUri: res.otpauthUri });
              });
            }}
          >
            <KeyRoundIcon size={15} aria-hidden className="mr-1.5" />
            {pending ? 'Starting…' : 'Enable 2FA'}
          </Button>
        )}

        {setup && (
          <div className="flex flex-col gap-3">
            <p className="text-foreground-secondary text-xs">
              Scan this QR code with your authenticator app, then enter the
              6-digit code it generates.
            </p>
            <div className="flex w-fit rounded-lg bg-white p-3">
              <QRCodeSVG
                value={setup.otpauthUri}
                size={192}
                level="M"
                includeMargin
                aria-label="Authenticator setup QR code"
              />
            </div>
            <p className="text-foreground-secondary text-xs">
              If you cannot scan it, enter this setup key manually:
            </p>
            <code className="border-border bg-background rounded border px-2 py-1 text-xs break-all">
              {formatSecret(setup.secret)}
            </code>
            <a
              href={setup.otpauthUri}
              className="text-xs underline-offset-2 hover:underline"
            >
              Open otpauth link
            </a>
            <Input
              label="Confirmation code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || confirmCode.trim().length < 6}
                onClick={() => {
                  setPending(true);
                  setError(null);
                  void confirmTotp(confirmCode).then((res) => {
                    setPending(false);
                    if (!res.ok) {
                      setError(res.error);
                      return;
                    }
                    setBackupCodes(res.backupCodes);
                    setSetup(null);
                    setConfirmCode('');
                    setEnabled(true);
                  });
                }}
              >
                <ShieldCheckIcon size={15} aria-hidden className="mr-1.5" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="text"
                onClick={() => {
                  setSetup(null);
                  setConfirmCode('');
                }}
              >
                <XIcon size={15} aria-hidden className="mr-1.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {enabled && !disabling && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDisabling(true)}
          >
            <ShieldOffIcon size={15} aria-hidden className="mr-1.5" />
            Disable 2FA
          </Button>
        )}

        {enabled && disabling && (
          <div className="flex flex-col gap-2">
            <Input
              label="Current password"
              variant="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || !disablePassword}
                onClick={() => {
                  setPending(true);
                  setError(null);
                  void disableTotp(disablePassword).then((res) => {
                    setPending(false);
                    if (!res.ok) {
                      setError(res.error);
                      return;
                    }
                    setEnabled(false);
                    setDisabling(false);
                    setDisablePassword('');
                  });
                }}
              >
                <ShieldOffIcon size={15} aria-hidden className="mr-1.5" />
                Confirm disable
              </Button>
              <Button
                size="sm"
                variant="text"
                onClick={() => {
                  setDisabling(false);
                  setDisablePassword('');
                }}
              >
                <XIcon size={15} aria-hidden className="mr-1.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-accent-red-strong text-sm">{error}</p>}
      </div>
    </SectionShell>
  );
}
