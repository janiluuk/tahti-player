import { Link } from '@tanstack/react-router';
import { KeyRoundIcon, LogInIcon, UserPlusIcon } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

import {
  persistPendingArtistKind,
  type ArtistKind,
} from '../lib/pendingArtistKind';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

const MINIMUM_PASSWORD_LENGTH = 8;

const slugifyUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export const AuthDialog: FC = () => {
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
  const [artistKind, setArtistKind] = useState<ArtistKind>('SINGLE');
  const [totpCode, setTotpCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    clearError();
    setMessage(null);
    setTotpCode('');
    setConfirmPassword('');
  }, [isOpen, mode, clearError]);

  useEffect(() => {
    setUsername(slugifyUsername(artistName));
  }, [artistName]);

  useEffect(() => {
    if (user && isOpen && !totpChallengeId) {
      close();
    }
  }, [user, isOpen, totpChallengeId, close]);

  const handleClose = () => {
    cancelTotp();
    close();
  };

  const titleIcon = totpChallengeId ? (
    <KeyRoundIcon size={18} aria-hidden />
  ) : mode === 'join' ? (
    <UserPlusIcon size={18} aria-hidden />
  ) : (
    <LogInIcon size={18} aria-hidden />
  );

  const title = totpChallengeId
    ? 'Two-factor code'
    : mode === 'join'
      ? 'Join'
      : 'Log in';
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

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
          ? 'Enter the 6-digit code from your authenticator app.'
          : mode === 'join'
            ? 'Create an account, then verify your email.'
            : 'Sign in to unlock your library, studio, and chat.'}
      </Dialog.Description>

      {totpChallengeId ? (
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Authentication code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.trim())}
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          {error ? (
            <p className="text-accent-red-strong text-sm">{error}</p>
          ) : null}
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => cancelTotp()}>
              Back
            </Button>
            <Button
              disabled={loading || totpCode.length < 6}
              onClick={() => {
                void completeTotp(totpCode)
                  .then(() => close())
                  .catch(() => undefined);
              }}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
          </Dialog.Actions>
        </div>
      ) : mode === 'login' ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (loading || !email || !password) {
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
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error ? (
            <p className="text-accent-red-strong text-sm">{error}</p>
          ) : null}
          <Link
            to="/forgot-password"
            onClick={handleClose}
            className="text-foreground-secondary self-start text-xs underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => setMode('join')}>
              Join
            </Button>
            <Button type="submit" disabled={loading || !email || !password}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Dialog.Actions>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="flex gap-2">
              {(
                [
                  ['SINGLE', 'Artist'],
                  ['COLLECTIVE', 'Band / Collective'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={artistKind === kind}
                  onClick={() => setArtistKind(kind)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    artistKind === kind
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              label={
                artistKind === 'COLLECTIVE' ? 'Collective name' : 'Artist name'
              }
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              autoComplete="name"
            />
            <Input
              label="Password"
              variant="password"
              size="sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              description="Min 8 characters"
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              variant="password"
              size="sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {passwordsDoNotMatch ? (
            <p className="text-accent-red-strong text-sm">
              Passwords do not match.
            </p>
          ) : null}
          {error ? (
            <p className="text-accent-red-strong text-sm">{error}</p>
          ) : null}
          {message ? (
            <p className="text-foreground-secondary text-sm">{message}</p>
          ) : null}
          <Dialog.Actions>
            <Button variant="text" size="sm" onClick={() => setMode('login')}>
              Log in
            </Button>
            <Button
              disabled={
                loading ||
                !email ||
                password.length < MINIMUM_PASSWORD_LENGTH ||
                !confirmPassword ||
                passwordsDoNotMatch ||
                !username ||
                !artistName
              }
              onClick={() => {
                clearError();
                void register({
                  email,
                  password,
                  username,
                  displayName: artistName,
                })
                  .then((msg) => {
                    persistPendingArtistKind(artistKind);
                    setMessage(msg);
                    if (import.meta.env.VITE_FORCE_MOCK === '1') {
                      setMode('login');
                    }
                  })
                  .catch(() => undefined);
              }}
            >
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </Dialog.Actions>
        </div>
      )}
    </Dialog.Root>
  );
};
