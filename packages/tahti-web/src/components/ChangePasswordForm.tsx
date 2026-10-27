import { useId, useState } from 'react';

import { Button, InlineError, Input } from '@tahti-player/ui';

import { changePassword } from '../api/account-credentials';
import { PASSWORD_RULES_HINT, passwordProblem } from '../lib/passwordRules';

/** Settings → Account → Password & email: change the password with the
 * current one; the API signs every other device out. */
export function ChangePasswordForm() {
  const headingId = useId();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const problem = next ? passwordProblem(next) : null;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    !saving &&
    current.length > 0 &&
    next.length > 0 &&
    !problem &&
    confirm === next;

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    setSaving(true);
    setError(null);
    setDone(null);
    void changePassword(current, next).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(result.message);
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="font-semibold">
        Change password
      </h3>
      <form
        className="flex max-w-md flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          label="Current password"
          variant="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          autoComplete="current-password"
        />
        <Input
          label="New password"
          variant="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          description={PASSWORD_RULES_HINT}
          autoComplete="new-password"
        />
        {problem ? <InlineError>{problem}</InlineError> : null}
        <Input
          label="Confirm new password"
          variant="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
        />
        {mismatch ? (
          <InlineError>Passwords don&apos;t match.</InlineError>
        ) : null}
        {error ? <InlineError>{error}</InlineError> : null}
        {done ? (
          <p role="status" className="text-sm">
            {done} We emailed you to confirm the change.
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={!canSubmit}>
            {saving ? 'Changing…' : 'Change password'}
          </Button>
        </div>
      </form>
    </section>
  );
}
