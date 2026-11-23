import { useCallback, useEffect, useId, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  cancelEmailChange,
  fetchPendingEmailChange,
  requestEmailChange,
  type PendingEmailChange,
} from '../api/account-credentials';
import { dateLocaleTag } from '../lib/locale';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Why `value` can't be the new address, or null when it can. */
export function newEmailProblem(
  value: string,
  currentEmail: string | null,
): 'invalidEmail' | 'emailSameAsCurrent' | null {
  const email = value.trim();
  if (!EMAIL_PATTERN.test(email)) {
    return 'invalidEmail';
  }
  if (currentEmail && email.toLowerCase() === currentEmail.toLowerCase()) {
    return 'emailSameAsCurrent';
  }
  return null;
}

/** `embedded` drops the heading when a dialog already titles the form. */
export function ChangeEmailForm({
  currentEmail,
  embedded = false,
}: {
  currentEmail: string | null;
  embedded?: boolean;
}) {
  const { t } = useTranslation('web');
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

  const [emailTouched, setEmailTouched] = useState(false);
  const emailProblem = newEmailProblem(newEmail, currentEmail);
  const showEmailProblem =
    emailProblem === 'emailSameAsCurrent' ||
    (emailProblem === 'invalidEmail' && emailTouched);
  const canSubmit = !saving && emailProblem === null && password.length > 0;

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

  const pendingUntil = pending
    ? new Date(pending.expiresAt).toLocaleString(dateLocaleTag(), {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <section
      aria-labelledby={embedded ? undefined : headingId}
      aria-label={embedded ? t('settingsBody.account.changeEmail') : undefined}
      className="flex flex-col gap-3"
    >
      {embedded ? null : (
        <h3 id={headingId} className="font-semibold">
          {t('settingsBody.account.changeEmail')}
        </h3>
      )}
      {pending ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {t('settingsBody.account.waitingConfirmation', {
              email: pending.newEmail,
              until: pendingUntil,
            })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={cancelling}
            onClick={cancel}
          >
            {cancelling
              ? t('settingsBody.account.cancelling')
              : t('settingsBody.account.cancelChange')}
          </Button>
        </div>
      ) : null}
      {currentEmail ? (
        <p className="text-foreground-secondary text-sm">
          {t('settingsBody.account.currentEmailNote', { email: currentEmail })}
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
          label={t('settingsBody.account.newEmail')}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          onBlur={() => setEmailTouched(newEmail.trim().length > 0)}
          autoComplete="email"
          aria-invalid={showEmailProblem || undefined}
        />
        {showEmailProblem && emailProblem ? (
          <InlineError>{t(`settingsBody.account.${emailProblem}`)}</InlineError>
        ) : null}
        <Input
          label={t('settingsBody.account.password')}
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
            {saving
              ? t('settingsBody.account.sending')
              : t('settingsBody.account.sendConfirmationLink')}
          </Button>
        </div>
      </form>
    </section>
  );
}
