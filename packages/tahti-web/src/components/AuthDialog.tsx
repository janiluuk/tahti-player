import { Link } from '@tanstack/react-router';
import {
  KeyRoundIcon,
  LogInIcon,
  MailCheckIcon,
  UserPlusIcon,
} from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  InlineError,
  Input,
  SegmentedControl,
} from '@tahti-player/ui';

import { passwordProblem, passwordRulesHint } from '../lib/passwordRules';
import {
  persistListenerSignup,
  persistPendingArtistKind,
  type ArtistKind,
} from '../lib/pendingArtistKind';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { UsernameAvailabilityHint } from './UsernameAvailabilityHint';

type AccountKind = ArtistKind | 'LISTENER';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_USERNAME = /^[a-z0-9_-]{2,32}$/;

const slugifyUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

function AuthDialogError({ message }: { message: string }) {
  return <InlineError aria-live="polite">{message}</InlineError>;
}

export const AuthDialog: FC = () => {
  const { t } = useTranslation('web');
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const mode = useAuthModalStore((s) => s.mode);
  const close = useAuthModalStore((s) => s.close);
  const setMode = useAuthModalStore((s) => s.setMode);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const completeTotp = useAuthStore((s) => s.completeTotp);
  const cancelTotp = useAuthStore((s) => s.cancelTotp);
  const totpChallengeId = useAuthStore((s) => s.totpChallengeId);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistKind, setArtistKind] = useState<AccountKind>('SINGLE');
  const [totpCode, setTotpCode] = useState('');
  const [registrationSuccessEmail, setRegistrationSuccessEmail] = useState<
    string | null
  >(null);
  const [attempted, setAttempted] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const mockRegistration =
    import.meta.env.VITE_FORCE_MOCK === '1' &&
    registrationSuccessEmail !== null;

  useEffect(() => {
    if (!isOpen) {
      setRegistrationSuccessEmail(null);
      return;
    }
    clearError();
    setTotpCode('');
    setConfirmPassword('');
    setAttempted(false);
    setUsernameAvailable(null);
  }, [isOpen, mode, clearError]);

  useEffect(() => {
    setUsername(slugifyUsername(artistName));
    setUsernameAvailable(null);
  }, [artistName]);

  useEffect(() => {
    if (user && isOpen && !totpChallengeId && !registrationSuccessEmail) {
      close();
    }
  }, [user, isOpen, totpChallengeId, registrationSuccessEmail, close]);

  const handleClose = () => {
    cancelTotp();
    setRegistrationSuccessEmail(null);
    close();
  };

  const titleIcon = registrationSuccessEmail ? (
    <MailCheckIcon size={18} aria-hidden />
  ) : totpChallengeId ? (
    <KeyRoundIcon size={18} aria-hidden />
  ) : mode === 'join' ? (
    <UserPlusIcon size={18} aria-hidden />
  ) : (
    <LogInIcon size={18} aria-hidden />
  );

  const accountKindOptions: { id: AccountKind; label: string }[] = [
    { id: 'LISTENER', label: t('auth.listener') },
    { id: 'SINGLE', label: t('auth.artist') },
    { id: 'COLLECTIVE', label: t('auth.collective') },
  ];
  const nameLabel: Record<AccountKind, string> = {
    LISTENER: t('auth.displayName'),
    SINGLE: t('auth.artistName'),
    COLLECTIVE: t('auth.collectiveName'),
  };
  const title = registrationSuccessEmail
    ? t('auth.registrationSuccessTitle')
    : totpChallengeId
      ? t('auth.twoFactorTitle')
      : mode === 'join'
        ? t('auth.join')
        : t('auth.logIn');

  const trimmedEmail = email.trim();
  const emailIssue = !trimmedEmail
    ? t('auth.emailRequired')
    : EMAIL_PATTERN.test(trimmedEmail)
      ? null
      : t('auth.emailInvalid');
  const nameIssue = !artistName.trim()
    ? t('auth.nameRequired')
    : usernameAvailable === false
      ? t('auth.usernameTaken')
      : username && !VALID_USERNAME.test(username)
        ? t('auth.usernameInvalid')
        : null;
  const passwordIssue =
    password.length > 0
      ? passwordProblem(password)
      : t('auth.passwordRequired');
  const confirmIssue = !confirmPassword
    ? t('auth.confirmPasswordRequired')
    : password !== confirmPassword
      ? t('auth.passwordsDoNotMatch')
      : null;
  const joinReady =
    !emailIssue &&
    !nameIssue &&
    !passwordProblem(password) &&
    Boolean(confirmPassword) &&
    password === confirmPassword &&
    usernameAvailable !== false;

  if (registrationSuccessEmail) {
    return (
      <Dialog.Root isOpen={isOpen} onClose={handleClose}>
        <Dialog.Title>
          <span className="inline-flex items-center gap-2">
            {titleIcon}
            {title}
          </span>
        </Dialog.Title>
        <div className="mt-4 flex flex-col items-center gap-4 text-center">
          <MailCheckIcon size={48} className="text-foreground" aria-hidden />
          <Dialog.Description>
            {mockRegistration
              ? t('auth.registrationSuccessMockDescription')
              : t('auth.registrationSuccessDescription', {
                  email: registrationSuccessEmail,
                })}
          </Dialog.Description>
        </div>
        <Dialog.Actions>
          {mockRegistration ? (
            <Button
              onClick={() => {
                setRegistrationSuccessEmail(null);
                setMode('login');
              }}
            >
              {t('auth.registrationSuccessSignIn')}
            </Button>
          ) : (
            <Button onClick={handleClose}>
              {t('auth.registrationSuccessGotIt')}
            </Button>
          )}
        </Dialog.Actions>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={handleClose}
      className={mode === 'join' ? 'max-w-2xl' : undefined}
    >
      <Dialog.Title>
        <span className="inline-flex items-center gap-2">
          {titleIcon}
          {title}
        </span>
      </Dialog.Title>
      <Dialog.Description>
        {totpChallengeId
          ? t('auth.totpDescription')
          : mode === 'join'
            ? t('auth.joinDescription')
            : t('auth.loginDescription')}
      </Dialog.Description>

      {totpChallengeId ? (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label={t('auth.totpLabel')}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.trim())}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            error={
              attempted && totpCode.length < 6
                ? t('auth.totpTooShort')
                : undefined
            }
          />
          {error ? <AuthDialogError message={error} /> : null}
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => cancelTotp()}>
              {t('auth.back')}
            </Button>
            <Button
              disabled={loading || totpCode.length < 6}
              onClick={() => {
                setAttempted(true);
                if (totpCode.length < 6) {
                  return;
                }
                void completeTotp(totpCode)
                  .then(() => close())
                  .catch(() => undefined);
              }}
            >
              {loading ? t('auth.verifying') : t('auth.verify')}
            </Button>
          </Dialog.Actions>
        </div>
      ) : mode === 'login' ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            if (loading || emailIssue || !password) {
              return;
            }
            void login(email, password)
              .then((r) => {
                if (!r.requiresTotp) {
                  close();
                }
              })
              .catch(() => undefined);
          }}
        >
          <Input
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={attempted && emailIssue ? emailIssue : undefined}
          />
          <Input
            label={t('auth.password')}
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={
              attempted && !password ? t('auth.passwordRequired') : undefined
            }
          />
          {error ? <AuthDialogError message={error} /> : null}
          <Link
            to="/forgot-password"
            onClick={handleClose}
            className="text-foreground-secondary self-start text-xs underline-offset-2 hover:underline"
          >
            {t('auth.forgotPassword')}
          </Link>
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => setMode('join')}>
              {t('auth.join')}
            </Button>
            <Button
              type="submit"
              disabled={loading || Boolean(emailIssue) || !password}
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </Dialog.Actions>
        </form>
      ) : (
        <form
          className="mt-4 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            if (loading || !joinReady) {
              return;
            }
            clearError();
            void register({
              email: trimmedEmail,
              password,
              username,
              displayName: artistName.trim(),
            })
              .then(() => {
                if (artistKind === 'LISTENER') {
                  persistListenerSignup();
                } else {
                  persistPendingArtistKind(artistKind);
                }
                setRegistrationSuccessEmail(trimmedEmail);
              })
              .catch(() => undefined);
          }}
        >
          <section className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-semibold">
              {t('auth.sectionAccount')}
            </h3>
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground-secondary text-xs font-medium">
                {t('auth.accountType')}
              </span>
              <SegmentedControl
                aria-label={t('auth.accountType')}
                options={accountKindOptions}
                value={artistKind}
                onChange={setArtistKind}
              />
            </div>
            <Input
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={attempted && emailIssue ? emailIssue : undefined}
            />
            <div className="flex flex-col gap-1">
              <Input
                label={nameLabel[artistKind]}
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                autoComplete="name"
                error={attempted && nameIssue ? nameIssue : undefined}
              />
              <UsernameAvailabilityHint
                username={username}
                onPick={setUsername}
                onAvailability={setUsernameAvailable}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-foreground text-sm font-semibold">
              {t('auth.sectionPassword')}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t('auth.password')}
                variant="password"
                size="sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                description={
                  attempted && passwordIssue ? undefined : passwordRulesHint()
                }
                error={
                  attempted && passwordIssue
                    ? passwordIssue
                    : password.length > 0 && passwordProblem(password)
                      ? passwordProblem(password)!
                      : undefined
                }
                autoComplete="new-password"
              />
              <Input
                label={t('auth.confirmPassword')}
                variant="password"
                size="sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={
                  (attempted || confirmPassword.length > 0) && confirmIssue
                    ? confirmIssue
                    : undefined
                }
                autoComplete="new-password"
              />
            </div>
          </section>

          {error ? <AuthDialogError message={error} /> : null}
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => setMode('login')}>
              {t('auth.logIn')}
            </Button>
            <Button type="submit" disabled={loading || !joinReady}>
              {loading ? t('auth.creating') : t('auth.createAccount')}
            </Button>
          </Dialog.Actions>
        </form>
      )}
    </Dialog.Root>
  );
};
