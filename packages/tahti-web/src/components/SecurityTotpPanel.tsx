import {
  CheckIcon,
  ShieldCheckIcon,
  ShieldHalfIcon,
  ShieldOffIcon,
  XIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useId, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Badge,
  Button,
  HelpTip,
  InlineError,
  Input,
  useUiLabels,
} from '@tahti-player/ui';

import {
  confirmTotp,
  disableTotp,
  fetchTotpStatus,
  setupTotp,
} from '../api/security';
import { PageError, PageLoading } from './PageStates';

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

export function SecurityTotpPanel() {
  const { t } = useTranslation('web');
  const labels = useUiLabels();
  const headingId = useId();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusAttempt, setStatusAttempt] = useState(0);
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
    let active = true;
    setEnabled(null);
    setStatusError(null);
    void fetchTotpStatus()
      .then((result) => {
        if (active) {
          setEnabled(result.data.enabled);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setStatusError(
            cause instanceof Error
              ? cause.message
              : t('settingsBody.account.totpUnavailable'),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [statusAttempt]);

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <h3 id={headingId} className="font-semibold">
        {t('settingsBody.account.totpTitle')}
      </h3>
      <HelpTip
        label={labels.aboutNamed(t('settingsBody.account.totpTitle'))}
        content={t('settingsBody.account.totpEmailNote')}
      />
      {enabled !== null ? (
        <Badge
          variant="pill"
          color={enabled ? 'green' : 'secondary'}
          data-testid="security-2fa-status"
        >
          {enabled
            ? t('settingsBody.account.totpEnabled')
            : t('settingsBody.account.totpDisabled')}
        </Badge>
      ) : null}
    </div>
  );

  const startSetup = () => {
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
  };

  if (enabled === null) {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        {header}
        {statusError ? (
          <PageError
            title={t('settingsBody.account.totpLoadError')}
            description={statusError}
            onRetry={() => setStatusAttempt((attempt) => attempt + 1)}
          />
        ) : (
          <PageLoading label={t('settingsBody.account.totpLoading')} />
        )}
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3"
      data-testid="security-2fa"
    >
      {header}
      <div className="flex flex-col gap-4">
        {!enabled ? (
          <Alert
            tone="info"
            data-testid="security-2fa-banner"
            icon={<ShieldHalfIcon size={18} aria-hidden />}
            title={t('settingsBody.account.twoFactorBannerTitle')}
          >
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm">
                {t('settingsBody.account.twoFactorBannerBody')}
              </p>
              {!setup ? (
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={pending}
                  onClick={startSetup}
                >
                  <ShieldCheckIcon size={14} aria-hidden />
                  {pending
                    ? t('settingsBody.account.totpStarting')
                    : t('settingsBody.account.twoFactorBannerAction')}
                </Button>
              ) : null}
            </div>
          </Alert>
        ) : null}

        {backupCodes && (
          <div className="border-border rounded-lg border px-3 py-2">
            <p className="text-sm font-medium">
              {t('settingsBody.account.totpBackupTitle')}
            </p>
            <p className="text-foreground-secondary mt-1 text-xs">
              {t('settingsBody.account.totpBackupDescription')}
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
              {t('settingsBody.account.totpDone')}
            </Button>
          </div>
        )}

        {setup && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
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
            <p className="text-foreground-secondary text-xs">
              {t('settingsBody.account.totpScanHint')}
            </p>
            <div className="flex w-fit rounded-lg bg-white p-3">
              <QRCodeSVG
                value={setup.otpauthUri}
                size={192}
                level="M"
                includeMargin
                aria-label={t('settingsBody.account.totpQrAria')}
              />
            </div>
            <p className="text-foreground-secondary text-xs">
              {t('settingsBody.account.totpManualHint')}
            </p>
            <code className="border-border bg-background rounded border px-2 py-1 text-xs break-all">
              {formatSecret(setup.secret)}
            </code>
            <a
              href={setup.otpauthUri}
              className="text-xs underline-offset-2 hover:underline"
            >
              {t('settingsBody.account.totpOpenLink')}
            </a>
            <Input
              label={t('settingsBody.account.totpConfirmCode')}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || confirmCode.trim().length < 6}
                type="submit"
              >
                <ShieldCheckIcon size={15} aria-hidden className="mr-1.5" />
                {t('settingsBody.account.totpConfirm')}
              </Button>
              <Button
                size="sm"
                variant="text"
                type="button"
                onClick={() => {
                  setSetup(null);
                  setConfirmCode('');
                }}
              >
                <XIcon size={15} aria-hidden className="mr-1.5" />
                {t('actions.cancel')}
              </Button>
            </div>
          </form>
        )}

        {enabled && !disabling && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDisabling(true)}
          >
            <ShieldOffIcon size={15} aria-hidden className="mr-1.5" />
            {t('settingsBody.account.totpDisable')}
          </Button>
        )}

        {enabled && disabling && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
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
            <Input
              label={t('settingsBody.account.currentPassword')}
              variant="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={pending || !disablePassword}
                type="submit"
              >
                <ShieldOffIcon size={15} aria-hidden className="mr-1.5" />
                {t('settingsBody.account.totpConfirmDisable')}
              </Button>
              <Button
                size="sm"
                variant="text"
                type="button"
                onClick={() => {
                  setDisabling(false);
                  setDisablePassword('');
                }}
              >
                <XIcon size={15} aria-hidden className="mr-1.5" />
                {t('actions.cancel')}
              </Button>
            </div>
          </form>
        )}

        {error && <InlineError>{error}</InlineError>}
      </div>
    </section>
  );
}
