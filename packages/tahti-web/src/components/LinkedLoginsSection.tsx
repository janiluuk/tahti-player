import { useCallback, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError } from '@tahti-player/ui';

import { accountHasPassword } from '../api/account-credentials';
import {
  fetchOAuthAccounts,
  OAUTH_PROVIDERS,
  unlinkOAuthAccount,
  type OAuthAccount,
  type OAuthProvider,
} from '../api/oauth';
import { beginOAuth } from '../lib/oauthReturn';
import { useAuthStore } from '../stores/authStore';
import { ConfirmDialog } from './ConfirmDialog';
import { OAUTH_PROVIDER_NAMES, OAuthProviderIcon } from './OAuthProviderIcon';
import { useOAuthProviders } from './OAuthSignInButtons';

export const LINKED_LOGINS_RETURN_TO = '/settings/security';

/** Settings → Security: Google/Facebook logins on this account, with Link
 * and Disconnect. The linked address is account info, never a name. */
export function LinkedLoginsSection() {
  const { t } = useTranslation('web');
  const headingId = useId();
  const providers = useOAuthProviders(true);
  const hasPassword = useAuthStore((s) => accountHasPassword(s.user));
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<OAuthProvider | null>(null);
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  const load = useCallback(() => {
    void fetchOAuthAccounts().then(({ data, meta }) => {
      setAccounts(data);
      setLoadFailed(meta.source === 'api' && Boolean(meta.reason));
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const linkedBy = new Map(
    accounts.map((account) => [account.provider, account]),
  );
  const onlyWayIn = !hasPassword && accounts.length === 1;
  const rows = OAUTH_PROVIDERS.filter(
    (provider) => providers.includes(provider) || linkedBy.has(provider),
  );

  if (rows.length === 0 && !loadFailed) {
    return null;
  }

  const disconnect = (provider: OAuthProvider) => {
    setConfirming(null);
    setBusy(provider);
    setError(null);
    void unlinkOAuthAccount(provider).then((result) => {
      setBusy(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        t('oauthLogin.disconnected', {
          provider: OAUTH_PROVIDER_NAMES[provider],
        }),
      );
      load();
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="font-semibold">
        {t('oauthLogin.linkedLogins')}
      </h3>
      <p className="text-foreground-secondary text-sm">
        {t('oauthLogin.linkedLoginsDescription')}
      </p>
      {loadFailed ? (
        <InlineError>{t('oauthLogin.loadFailed')}</InlineError>
      ) : null}
      <ul className="flex flex-col gap-2">
        {rows.map((provider) => {
          const account = linkedBy.get(provider);
          const name = OAUTH_PROVIDER_NAMES[provider];
          return (
            <li
              key={provider}
              className="border-border flex flex-wrap items-center gap-3 rounded-md border p-3"
            >
              <OAuthProviderIcon provider={provider} size={20} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-foreground-secondary truncate text-xs">
                  {account
                    ? account.email
                      ? t('oauthLogin.statusLinked', { email: account.email })
                      : t('oauthLogin.statusLinkedNoEmail')
                    : t('oauthLogin.statusNotLinked')}
                </span>
              </div>
              {account ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy === provider}
                  aria-label={`${t('oauthLogin.disconnect')} ${name}`}
                  onClick={() => setConfirming(provider)}
                >
                  {t('oauthLogin.disconnect')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`${t('oauthLogin.link')} ${name}`}
                  onClick={() =>
                    beginOAuth(provider, {
                      returnTo: LINKED_LOGINS_RETURN_TO,
                      link: true,
                    })
                  }
                >
                  {t('oauthLogin.link')}
                </Button>
              )}
              {account && onlyWayIn ? (
                <p className="text-foreground-secondary w-full text-xs">
                  {t('oauthSetPassword.disconnectHint')}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? <InlineError aria-live="polite">{error}</InlineError> : null}
      <ConfirmDialog
        isOpen={confirming !== null}
        title={t('oauthLogin.disconnectTitle', {
          provider: confirming ? OAUTH_PROVIDER_NAMES[confirming] : '',
        })}
        description={t('oauthLogin.disconnectDescription', {
          provider: confirming ? OAUTH_PROVIDER_NAMES[confirming] : '',
        })}
        confirmLabel={t('oauthLogin.disconnect')}
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) {
            disconnect(confirming);
          }
        }}
      />
    </section>
  );
}
