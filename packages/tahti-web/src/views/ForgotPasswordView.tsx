import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import { useAuthStore } from '../stores/authStore';

export function ForgotPasswordView() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !loading;

  const onSubmit = () => {
    if (!canSubmit) {
      return;
    }
    setMessage(null);
    void forgotPassword(email.trim()).then(setMessage);
  };

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
          Reset your password
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Enter the email on your account and we&apos;ll send a link to choose a
          new password.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        {message ? (
          <p className="text-accent-green-strong text-sm">{message}</p>
        ) : null}
        <Button disabled={!canSubmit} onClick={onSubmit}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </div>
    </div>
  );
}
