import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Box, Button, InlineError, Input } from '@tahti-player/ui';

import { fetchSetupPasswordInfo } from '../api/client';
import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

/** One-time invite link (`/setup-password?token=`) — lets a passwordless
 * account (board-invited, imported from a legacy import) set an initial
 * password. Prod has no separate "change password" settings page — TOTP is
 * the only ongoing account-security control, alongside this one-time flow. */
export function SetupPasswordView() {
  const navigate = useNavigate();
  const setupPassword = useAuthStore((s) => s.setupPassword);
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
      setInfoError('Missing setup link token.');
      return;
    }
    void fetchSetupPasswordInfo(token).then((r) => {
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
    void setupPassword(token, password, info?.email)
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
          {done ? 'Password set' : 'Set your password'}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          {info
            ? `Welcome, ${info.displayName} — finish setting up ${info.email}.`
            : 'Open the invite link from your email, or one is already loaded below.'}
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
            Ask whoever invited you for a fresh link, or{' '}
            <Link to="/login" className="underline-offset-2 hover:underline">
              log in
            </Link>{' '}
            if you already have a password.
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
            label="Password"
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
            label="Confirm password"
            variant="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && <InlineError>Passwords don&apos;t match.</InlineError>}
          {error && <InlineError>{error}</InlineError>}
          <Button disabled={!canSubmit} type="submit">
            {loading ? 'Setting password…' : 'Set password'}
          </Button>
        </form>
      )}
    </div>
  );
}
