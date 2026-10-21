import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Box, Button, Input } from '@tahti-player/ui';

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
          <p className="text-accent-red-strong text-sm">{infoError}</p>
          <p className="text-foreground-secondary text-sm">
            Ask whoever invited you for a fresh link, or{' '}
            <Link to="/login" className="underline-offset-2 hover:underline">
              log in
            </Link>{' '}
            if you already have a password.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
            <p className="text-accent-red-strong text-sm">
              Password must be at least 8 characters.
            </p>
          )}
          <Input
            label="Confirm password"
            variant="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="text-accent-red-strong text-sm">
              Passwords don&apos;t match.
            </p>
          )}
          {error && <p className="text-accent-red-strong text-sm">{error}</p>}
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {loading ? 'Setting password…' : 'Set password'}
          </Button>
        </div>
      )}
    </div>
  );
}
