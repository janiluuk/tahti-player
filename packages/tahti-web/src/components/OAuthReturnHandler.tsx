import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { isForceMock } from '../api/mode';
import {
  OAUTH_ERROR_KEYS,
  readOAuthReturn,
  takePendingOAuth,
} from '../lib/oauthReturn';
import { webT } from '../lib/webT';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { OAUTH_PROVIDER_NAMES } from './OAuthProviderIcon';

/** Finishes a Google/Facebook round trip once per page load: `?oauth=ok`
 * refreshes the session, `?oauth=totp` opens the two-factor step for the
 * returned challenge, `?oauth_error=<code>` explains what went wrong. The
 * params leave the address bar. */
export function OAuthReturnHandler() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    const { pathname, search, hash } = window.location;
    const result = readOAuthReturn(search);
    if (!result) {
      return;
    }
    handled.current = true;
    const pending = takePendingOAuth();
    void navigate({
      href: `${pathname}${result.search}${hash}`,
      replace: true,
    });
    const t = webT();

    if (result.kind === 'totp') {
      useAuthStore.setState({
        totpChallengeId: result.challengeId,
        error: null,
      });
      useAuthModalStore.getState().open('login');
      return;
    }

    if (result.kind === 'error') {
      if (useAuthStore.getState().user) {
        toast.error(t(OAUTH_ERROR_KEYS[result.code]));
      } else {
        useAuthModalStore.getState().openWithOAuthError(result.code);
      }
      return;
    }

    void useAuthStore
      .getState()
      .refresh()
      .then(async () => {
        if (isForceMock() && !useAuthStore.getState().user) {
          await useAuthStore
            .getState()
            .login('oauth.demo@tahti.live', 'oauth-demo')
            .catch(() => undefined);
        }
        if (!useAuthStore.getState().user) {
          useAuthModalStore.getState().openWithOAuthError('failed');
          return;
        }
        const provider = pending
          ? OAUTH_PROVIDER_NAMES[pending.provider]
          : null;
        toast.success(
          provider
            ? pending?.link
              ? t('oauthLogin.linkedToast', { provider })
              : t('oauthLogin.signedInWith', { provider })
            : t('oauthLogin.signedIn'),
        );
      });
  }, [navigate]);

  return null;
}
