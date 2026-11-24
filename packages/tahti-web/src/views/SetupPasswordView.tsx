import { useNavigate } from '@tanstack/react-router';
import { CircleAlertIcon, KeyRoundIcon, LogInIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Box,
  Button,
  ButtonLink,
  InlineError,
  Input,
} from '@tahti-player/ui';

import { fetchSetupPasswordInfo } from '../api/client';
import { PageBackLink } from '../components/PageBackLink';
import { passwordProblem, passwordRulesHint } from '../lib/passwordRules';
import { webT } from '../lib/webT';
import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

export function SetupPasswordView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const setupPassword = useAuthStore((s) => s.setupPassword);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const signedIn = useAuthStore((s) => Boolean(s.user));

  const [token] = useState(tokenFromSearch);
  const [info, setInfo] = useState<{
    email: string;
    displayName: string;
  } | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  // Checked once per token: the link is single-use, so asking again after
  // a successful setup (e.g. a re-render once the new session's language
  // loads) would report the just-used link as invalid.
  useEffect(() => {
    if (!token) {
      setInfoError(webT()('auth.setupMissingToken'));
      return;
    }
    let active = true;
    void fetchSetupPasswordInfo(token).then((r) => {
      if (!active) {
        return;
      }
      if (r.ok) {
        setInfo({ email: r.email, displayName: r.displayName });
      } else {
        setInfoError(r.error);
      }
    });
    return () => {
      active = false;
    };
  }, [token]);

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
    void setupPassword(token, password, info?.email)
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
          {done ? t('auth.setupDoneTitle') : t('auth.setupTitle')}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          {info
            ? t('auth.setupGreeting', {
                name: info.displayName,
                email: info.email,
              })
            : t('auth.setupHint')}
        </p>
      </div>

      {done ? (
        <Box
          variant="tertiary"
          className="h-auto w-auto flex-col gap-3 rounded-xl"
        >
          <p role="status" className="text-sm">
            {t('auth.setupSignedIn')}
          </p>
        </Box>
      ) : infoError && signedIn ? (
        <Alert
          tone="success"
          data-testid="setup-already-signed-in"
          title={t('auth.setupAlreadySignedInTitle')}
        >
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm">{t('auth.setupAlreadySignedInBody')}</p>
            <ButtonLink to="/studio" size="sm">
              {t('auth.setupGoToStudio')}
            </ButtonLink>
          </div>
        </Alert>
      ) : infoError ? (
        <Alert
          tone="error"
          data-testid="setup-link-error"
          icon={<CircleAlertIcon size={18} aria-hidden />}
          title={t('auth.setupLinkInvalidTitle')}
        >
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium">{infoError}</p>
            <p className="text-sm">{t('auth.setupLinkInvalidBody')}</p>
            <ul className="list-disc pl-5 text-sm">
              <li>{t('auth.setupLinkStepLogIn')}</li>
              <li>{t('auth.setupLinkStepReset')}</li>
              <li>{t('auth.setupLinkStepAsk')}</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/login" size="sm">
                <LogInIcon size={15} aria-hidden className="mr-1.5" />
                {t('auth.logIn')}
              </ButtonLink>
              <ButtonLink to="/forgot-password" size="sm" variant="secondary">
                <KeyRoundIcon size={15} aria-hidden className="mr-1.5" />
                {t('auth.setupSendNewLink')}
              </ButtonLink>
            </div>
          </div>
        </Alert>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            label={t('auth.password')}
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            description={passwordRulesHint()}
            autoComplete="new-password"
            autoFocus
          />
          {problem && <InlineError>{problem}</InlineError>}
          <Input
            label={t('auth.confirmPassword')}
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
            {loading ? t('auth.setupSetting') : t('auth.setupSubmit')}
          </Button>
        </form>
      )}
    </div>
  );
}
