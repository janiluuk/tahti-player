import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, InlineError, Input } from '@tahti-player/ui';

import { fetchResetPasswordInfo } from '../api/client';
import { PageBackLink } from '../components/PageBackLink';
import { passwordProblem, passwordRulesHint } from '../lib/passwordRules';
import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

export function ResetPasswordView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [token] = useState(tokenFromSearch);
  const [info, setInfo] = useState<{
    email: string;
    displayName: string;
  } | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setInfoError(t('auth.resetMissingToken'));
      return;
    }
    void fetchResetPasswordInfo(token).then((r) => {
      if (r.ok) {
        setInfo({ email: r.email, displayName: r.displayName });
      } else {
        setInfoError(r.error);
      }
    });
  }, [token, t]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const problem = password.length > 0 ? passwordProblem(password) : null;
  const canSubmit =
    Boolean(token) &&
    password.length > 0 &&
    !problem &&
    password === confirm &&
    !loading;

  const onSubmit = () => {
    if (!canSubmit) {
      return;
    }
    clearError();
    void resetPassword(token, password, info?.email)
      .then(() => setDone(true))
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!done) {
      return;
    }
    const timer = setTimeout(() => {
      const hasChannel = Boolean(useAuthStore.getState().user?.channel);
      void navigate({ to: hasChannel ? '/studio' : '/feed' });
    }, 1200);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <PageBackLink to="/login" label={t('auth.logIn')} />
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {done ? t('auth.resetDoneTitle') : t('auth.resetTitle')}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          {info
            ? t('auth.resetGreeting', {
                name: info.displayName,
                email: info.email,
              })
            : t('auth.resetHint')}
        </p>
      </div>

      {done ? (
        <Box
          variant="tertiary"
          className="h-auto w-auto flex-col gap-3 rounded-xl"
        >
          <p className="text-sm">{t('auth.resetSignedIn')}</p>
        </Box>
      ) : infoError ? (
        <div className="flex flex-col gap-3">
          <InlineError>{infoError}</InlineError>
          <p className="text-foreground-secondary text-sm">
            {t('auth.resetRequestNewPrefix')}{' '}
            <Link
              to="/forgot-password"
              className="underline-offset-2 hover:underline"
            >
              {t('auth.resetPasswordPage')}
            </Link>
            {t('auth.resetOr')}{' '}
            <Link to="/login" className="underline-offset-2 hover:underline">
              {t('auth.logIn').toLowerCase()}
            </Link>{' '}
            {t('auth.resetIfRemember')}
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            label={t('auth.resetNewPassword')}
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            description={passwordRulesHint()}
            autoComplete="new-password"
            autoFocus
          />
          {problem && <InlineError>{problem}</InlineError>}
          <Input
            label={t('auth.resetConfirmNewPassword')}
            variant="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <InlineError>{t('auth.passwordsDoNotMatch')}</InlineError>
          )}
          {error && <InlineError>{error}</InlineError>}
          <Button disabled={!canSubmit} type="submit">
            {loading ? t('auth.resetSaving') : t('auth.resetSubmit')}
          </Button>
        </form>
      )}
    </div>
  );
}
