import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, ButtonLink, InlineError, Input } from '@tahti-player/ui';

import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

export function VerifyView() {
  const { t } = useTranslation('web');
  const verify = useAuthStore((s) => s.verify);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [token, setToken] = useState(tokenFromSearch);
  const [message, setMessage] = useState<string | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  useEffect(() => {
    const t = tokenFromSearch().trim();
    if (!t || autoTried) {
      return;
    }
    setAutoTried(true);
    setToken(t);
    clearError();
    void verify(t)
      .then((msg) => {
        setMessage(msg);
      })
      .catch(() => undefined);
  }, [autoTried, clearError, verify]);

  const onSubmit = () => {
    const t = token.trim();
    if (!t) {
      return;
    }
    clearError();
    void verify(t)
      .then((msg) => setMessage(msg))
      .catch(() => undefined);
  };

  const ok = Boolean(message) && !error;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {ok
            ? t('verifyViewStates.emailVerified')
            : t('verifyViewStates.verifyEmail')}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Open the link from your signup email, or paste the token below. Calls{' '}
          <code>GET /api/auth/verify</code>.
        </p>
      </div>

      {ok ? (
        <Box
          variant="tertiary"
          className="h-auto w-auto flex-col gap-3 rounded-xl"
        >
          <p className="text-sm">{message}</p>
          <ButtonLink to="/login">{t('verifyView.continueToLogin')}</ButtonLink>
        </Box>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('verifyView.verificationToken')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            description={t('verifyView.fromTokenInTheEmail')}
          />
          {error && <InlineError>{error}</InlineError>}
          {message && !error && (
            <p className="text-foreground-secondary text-sm">{message}</p>
          )}
          <Button disabled={loading || !token.trim()} type="submit">
            {loading
              ? t('verifyViewStates.verifying')
              : t('verifyViewStates.verifyEmail')}
          </Button>
        </form>
      )}

      <p className="text-foreground-secondary text-sm">
        Need an account?{' '}
        <Link to="/join" className="underline-offset-2 hover:underline">
          {t('verifyView.join')}
        </Link>
      </p>
    </div>
  );
}
