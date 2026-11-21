import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { fetchOAuthProviders, type OAuthProvider } from '../api/oauth';
import { beginOAuth, currentReturnTo } from '../lib/oauthReturn';
import { OAuthProviderIcon } from './OAuthProviderIcon';

/** Providers the API lists, loaded once per page. */
let providersRequest: Promise<OAuthProvider[]> | null = null;

function loadProviders(): Promise<OAuthProvider[]> {
  providersRequest ??= fetchOAuthProviders().then(
    ({ data, meta }) => {
      if (meta.reason && meta.source === 'api') {
        providersRequest = null;
      }
      return data;
    },
    () => {
      providersRequest = null;
      return [];
    },
  );
  return providersRequest;
}

export function resetOAuthProvidersForTests(): void {
  providersRequest = null;
}

export function useOAuthProviders(enabled: boolean): OAuthProvider[] {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void loadProviders().then((list) => {
      if (!cancelled) {
        setProviders(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return providers;
}

/** "Continue with Google / Facebook" above the email form, with an "or"
 * divider; nothing at all when no provider is configured. */
export function OAuthSignInButtons({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation('web');
  const providers = useOAuthProviders(enabled);
  if (providers.length === 0) {
    return null;
  }
  const label: Record<OAuthProvider, string> = {
    google: t('oauthLogin.continueWithGoogle'),
    facebook: t('oauthLogin.continueWithFacebook'),
  };
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <Button
            key={provider}
            variant="tertiary"
            className="w-full justify-center gap-2"
            onClick={() =>
              beginOAuth(provider, { returnTo: currentReturnTo() })
            }
          >
            <OAuthProviderIcon provider={provider} />
            {label[provider]}
          </Button>
        ))}
      </div>
      <div
        className="text-foreground-secondary flex items-center gap-3 text-xs"
        role="separator"
        aria-label={t('oauthLogin.or')}
      >
        <span className="bg-border h-px flex-1" aria-hidden />
        <span aria-hidden>{t('oauthLogin.or')}</span>
        <span className="bg-border h-px flex-1" aria-hidden />
      </div>
    </div>
  );
}
