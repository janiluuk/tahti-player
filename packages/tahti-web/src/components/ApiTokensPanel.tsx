import { KeyRoundIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Badge,
  Button,
  CopyButton,
  InlineError,
  Input,
  SectionShell,
  Select,
  Toggle,
} from '@tahti-player/ui';

import {
  createApiToken,
  fetchApiTokens,
  mcpEndpointUrl,
  revokeApiToken,
  type ApiToken,
} from '../api/api-tokens';
import { toastWithUndo } from '../lib/undoToast';
import { ConfirmDialog } from './ConfirmDialog';
import { ListingDate } from './ListingDate';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

function isExpired(token: ApiToken): boolean {
  return Boolean(token.expiresAt && new Date(token.expiresAt) <= new Date());
}

export function ApiTokensPanel() {
  const { t } = useTranslation('web');
  const expiryOpts = [
    { id: 'never', label: t('settingsBody.account.apiTokensExpiryNever') },
    { id: '30', label: t('settingsBody.account.apiTokensExpiry30') },
    { id: '90', label: t('settingsBody.account.apiTokensExpiry90') },
    { id: '365', label: t('settingsBody.account.apiTokensExpiry365') },
  ];
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [canWrite, setCanWrite] = useState(false);
  const [expiry, setExpiry] = useState('never');
  const [saving, setSaving] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiToken | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchApiTokens().then((result) => {
      setTokens(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, [attempt]);

  const createToken = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    setSaving(true);
    setError(null);
    void createApiToken(
      trimmedName,
      canWrite ? ['read', 'write'] : ['read'],
      expiry === 'never' ? undefined : Number(expiry),
    ).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { token, ...view } = result.data;
      setTokens((current) => [view, ...current]);
      setRevealedToken(token);
      setAdding(false);
      setName('');
      setCanWrite(false);
      setExpiry('never');
      toastWithUndo(t('settingsBody.account.apiTokensCreatedToast'), {
        undo: () => revokeApiToken(view.id),
        undoneMessage: t('settingsBody.account.apiTokensRevokedToast'),
        onUndone: () => {
          setTokens((current) => current.filter((item) => item.id !== view.id));
          setRevealedToken(null);
        },
      });
    });
  };

  const revokeToken = (token: ApiToken) => {
    void revokeApiToken(token.id).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTokens((current) => current.filter((item) => item.id !== token.id));
      toast.success(t('settingsBody.account.apiTokensRevokedToast'));
    });
  };

  const showEmpty = !loadError && tokens.length === 0;

  return (
    <SectionShell title={t('settingsBody.account.apiTokensTitle')}>
      <p className="text-foreground-secondary mb-4 text-sm">
        {t('settingsBody.account.apiTokensIntro')}
      </p>
      <div className="mb-4 flex flex-col gap-2" data-testid="api-tokens-mcp">
        <p className="text-foreground-secondary text-sm">
          {t('settingsBody.account.apiTokensMcpIntro')}
        </p>
        <div className="flex items-center gap-2">
          <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
            {mcpEndpointUrl()}
          </code>
          <CopyButton
            text={mcpEndpointUrl()}
            aria-label={t('settingsBody.account.apiTokensCopyMcpAria')}
            toastMessage={t('settingsBody.account.apiTokensUrlCopied')}
          />
        </div>
      </div>
      {loading ? (
        <PageLoading label={t('settingsBody.account.apiTokensLoading')} />
      ) : (
        <div className="flex flex-col gap-4">
          {revealedToken ? (
            <Alert
              tone="warning"
              className="text-foreground"
              title={t('settingsBody.account.apiTokensNewAlert')}
            >
              <div className="mt-2 flex flex-wrap gap-2">
                <Input
                  aria-label={t('settingsBody.account.apiTokensNewAria')}
                  value={revealedToken}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <CopyButton
                  text={revealedToken}
                  size="sm"
                  variant="secondary"
                  toastMessage={t('settingsBody.account.apiTokensTokenCopied')}
                  aria-label={t('settingsBody.account.apiTokensCopyTokenAria')}
                />
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setRevealedToken(null)}
                >
                  {t('settingsBody.account.apiTokensDismiss')}
                </Button>
              </div>
            </Alert>
          ) : null}

          {loadError && tokens.length === 0 ? (
            <PageError
              title={t('settingsBody.account.apiTokensLoadError')}
              description={loadError}
              onRetry={() => {
                setLoading(true);
                setAttempt((n) => n + 1);
              }}
            />
          ) : tokens.length === 0 ? (
            <PageEmpty
              title={t('settingsBody.account.apiTokensEmptyTitle')}
              description={t('settingsBody.account.apiTokensEmptyDescription')}
              action={
                adding ? undefined : (
                  <Button size="sm" onClick={() => setAdding(true)}>
                    <KeyRoundIcon size={16} aria-hidden />
                    {t('settingsBody.account.apiTokensNew')}
                  </Button>
                )
              }
            />
          ) : (
            <>
              {loadError ? (
                <PageErrorBanner
                  title={t('settingsBody.account.apiTokensRefreshError')}
                  description={loadError}
                  onRetry={() => {
                    setLoading(true);
                    setAttempt((n) => n + 1);
                  }}
                />
              ) : null}
              <ul className="divide-border divide-y">
                {tokens.map((token) => (
                  <li
                    key={token.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {token.name}{' '}
                        <span className="text-foreground-secondary font-mono text-xs">
                          {token.tokenPrefix}…
                        </span>
                        {isExpired(token) ? (
                          <Badge variant="pill" color="red">
                            {t('settingsBody.account.apiTokensExpired')}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-foreground-secondary flex flex-wrap items-center gap-x-1 text-xs">
                        <span>
                          {token.scopes.includes('write')
                            ? t('settingsBody.account.apiTokensReadWrite')
                            : t('settingsBody.account.apiTokensReadOnly')}{' '}
                          · {t('settingsBody.account.apiTokensLastUsed')}
                        </span>
                        {token.lastUsedAt ? (
                          <ListingDate value={token.lastUsedAt} />
                        ) : (
                          <span>
                            {t('settingsBody.account.apiTokensNever')}
                          </span>
                        )}
                        <span>
                          · {t('settingsBody.account.apiTokensCreated')}
                        </span>
                        <ListingDate value={token.createdAt} />
                        {token.expiresAt ? (
                          <>
                            <span>
                              ·{' '}
                              {isExpired(token)
                                ? t('settingsBody.account.apiTokensExpiredAt')
                                : t('settingsBody.account.apiTokensExpires')}
                            </span>
                            <ListingDate value={token.expiresAt} />
                          </>
                        ) : null}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingRevoke(token)}
                    >
                      {t('settingsBody.account.apiTokensRevoke')}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!adding ? (
            showEmpty ? null : (
              <Button
                size="sm"
                className="self-start"
                onClick={() => setAdding(true)}
              >
                <KeyRoundIcon size={16} aria-hidden />
                {t('settingsBody.account.apiTokensNew')}
              </Button>
            )
          ) : (
            <form
              className="border-border flex flex-col gap-3 border-t pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                createToken();
              }}
            >
              {error ? <InlineError>{error}</InlineError> : null}
              <Input
                autoComplete="off"
                label={t('settingsBody.account.apiTokensName')}
                value={name}
                maxLength={64}
                placeholder={t('settingsBody.account.apiTokensNamePlaceholder')}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="text-foreground-secondary flex items-center justify-between gap-3 text-sm">
                <span>{t('settingsBody.account.apiTokensWriteHint')}</span>
                <Toggle
                  label={t('settingsBody.account.apiTokensWriteLabel')}
                  checked={canWrite}
                  onChange={setCanWrite}
                />
              </div>
              <Select
                label={t('settingsBody.account.apiTokensExpiresLabel')}
                value={expiry}
                onValueChange={setExpiry}
                options={expiryOpts}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={saving || name.trim().length === 0}
                  type="submit"
                >
                  {saving
                    ? t('settingsBody.account.apiTokensCreating')
                    : t('settingsBody.account.apiTokensCreate')}
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => {
                    setAdding(false);
                    setError(null);
                  }}
                >
                  {t('actions.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
      <ConfirmDialog
        destructive
        isOpen={pendingRevoke !== null}
        title={
          pendingRevoke
            ? t('settingsBody.account.apiTokensRevokeNamed', {
                name: pendingRevoke.name,
              })
            : t('settingsBody.account.apiTokensRevokeTitle')
        }
        description={t('settingsBody.account.apiTokensRevokeDescription')}
        confirmLabel={t('settingsBody.account.apiTokensRevoke')}
        onCancel={() => setPendingRevoke(null)}
        onConfirm={() => {
          const token = pendingRevoke;
          setPendingRevoke(null);
          if (token) {
            revokeToken(token);
          }
        }}
      />
    </SectionShell>
  );
}
