import { useCallback, useEffect, useId, useState } from 'react';

import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  cancelEmailChange,
  fetchPendingEmailChange,
  requestEmailChange,
  type PendingEmailChange,
} from '../api/account-credentials';

/** Settings → Account → Password & email: move the account to another
 * address. Nothing changes until the link sent there is opened. */
export function ChangeEmailForm({
  currentEmail,
}: {
  currentEmail: string | null;
}) {
  const headingId = useId();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingEmailChange | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadPending = useCallback(() => {
    void fetchPendingEmailChange().then(setPending);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const cancel = () => {
    setCancelling(true);
    setError(null);
    void cancelEmailChange().then((result) => {
      setCancelling(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(null);
      setPending(null);
    });
  };

  const canSubmit = !saving && newEmail.includes('@') && password.length > 0;

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    setSaving(true);
    setError(null);
    setSent(null);
    void requestEmailChange(newEmail.trim(), password).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword('');
      setSent(result.message);
      loadPending();
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="font-semibold">
        Change email
      </h3>
      {pending ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            Waiting for confirmation at {pending.newEmail} (the link works until{' '}
            {new Date(pending.expiresAt).toLocaleString(undefined, {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            ).
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={cancelling}
            onClick={cancel}
          >
            {cancelling ? 'Cancelling…' : 'Cancel change'}
          </Button>
        </div>
      ) : null}
      {currentEmail ? (
        <p className="text-foreground-secondary text-sm">
          Now: {currentEmail}. We send a link to the new address, and tell this
          one once the change is done.
        </p>
      ) : null}
      <form
        className="flex max-w-md flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          label="New email"
          inputMode="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          autoComplete="email"
        />
        <Input
          label="Password"
          variant="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
        {error ? <InlineError>{error}</InlineError> : null}
        {sent ? (
          <p role="status" className="text-sm">
            {sent}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={!canSubmit}>
            {saving ? 'Sending…' : 'Send confirmation link'}
          </Button>
        </div>
      </form>
    </section>
  );
}
