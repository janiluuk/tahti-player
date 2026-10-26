import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Box, Button, InlineError, Input } from '@tahti-player/ui';

import { fetchResetPasswordInfo } from '../api/client';
import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

/** Password-reset link (`/reset-password?token=`) — resolves the account,
 * then lets the user pick a new password and signs them straight in. */
export function ResetPasswordView() {
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
      setInfoError('Missing reset link token.');
      return;
    }
    void fetchResetPasswordInfo(token).then((r) => {
      if (r.ok) {
        setInfo({ email: r.email, displayName: r.displayName });
      } else {
        setInfoError(r.error);
      }
    });
  }, [token]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit =
    Boolean(token) && password.length >= 8 && password === confirm && !loading;

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
    const t = setTimeout(() => {
      const hasChannel = Boolean(useAuthStore.getState().user?.channel);
      void navigate({ to: hasChannel ? '/studio' : '/feed' });
    }, 1200);
    return () => clearTimeout(t);
  }, [done, navigate]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Link
        to="/login"
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← Login
      </Link>
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {done ? 'Password reset' : 'Choose a new password'}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          {info
            ? `Hi ${info.displayName}, set a new password for ${info.email}.`
            : 'Open the reset link from your email, or one is already loaded below.'}
        </p>
      </div>

      {done ? (
        <Box
          variant="tertiary"
          className="h-auto w-auto flex-col gap-3 rounded-xl"
        >
          <p className="text-sm">Signed in — taking you to your dashboard…</p>
        </Box>
      ) : infoError ? (
        <div className="flex flex-col gap-3">
          <InlineError>{infoError}</InlineError>
          <p className="text-foreground-secondary text-sm">
            Request a new one from the{' '}
            <Link
              to="/forgot-password"
              className="underline-offset-2 hover:underline"
            >
              password reset page
            </Link>
            , or{' '}
            <Link to="/login" className="underline-offset-2 hover:underline">
              log in
            </Link>{' '}
            if you remember your password.
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
            label="New password"
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            description="At least 8 characters"
            autoComplete="new-password"
            autoFocus
          />
          {tooShort && (
            <InlineError>Password must be at least 8 characters.</InlineError>
          )}
          <Input
            label="Confirm new password"
            variant="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && <InlineError>Passwords don&apos;t match.</InlineError>}
          {error && <InlineError>{error}</InlineError>}
          <Button disabled={!canSubmit} type="submit">
            {loading ? 'Saving…' : 'Reset password & sign in'}
          </Button>
        </form>
      )}
    </div>
  );
}
