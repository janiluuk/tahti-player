import { useId, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  accountHasPassword,
  setFirstPassword,
} from '../api/account-credentials';
import { passwordProblem, passwordRulesHint } from '../lib/passwordRules';
import { useAuthStore } from '../stores/authStore';

/** The API has confirmed a password exists (204 or 409), so the change form
 * must replace this one even when the refreshed profile is stale or failed. */
async function refreshWithPassword(): Promise<void> {
  await useAuthStore
    .getState()
    .refresh()
    .catch(() => undefined);
  const user = useAuthStore.getState().user;
  if (user && !accountHasPassword(user)) {
    useAuthStore.setState({ user: { ...user, hasPassword: true } });
  }
}

/** Settings → Security for an account created with Google/Facebook that has
 * no password yet. */
/** `embedded` drops the heading when a dialog already titles the form. */
export function SetPasswordForm({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation('web');
  const headingId = useId();
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problem = next ? passwordProblem(next) : null;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = !saving && next.length > 0 && !problem && confirm === next;

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    setSaving(true);
    setError(null);
    void setFirstPassword(next).then(async (result) => {
      if (result.ok) {
        await refreshWithPassword();
        toast.success(t('oauthSetPassword.setToast'));
        return;
      }
      if (result.alreadySet) {
        await refreshWithPassword();
        return;
      }
      setSaving(false);
      setError(result.error);
    });
  };

  return (
    <section
      aria-labelledby={embedded ? undefined : headingId}
      aria-label={embedded ? t('oauthSetPassword.heading') : undefined}
      className="flex flex-col gap-3"
    >
      {embedded ? null : (
        <h3 id={headingId} className="font-semibold">
          {t('oauthSetPassword.heading')}
        </h3>
      )}
      <p className="text-foreground-secondary text-sm">
        {t('oauthSetPassword.description')}
      </p>
      <form
        className="flex max-w-md flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          label={t('settingsBody.account.newPassword')}
          variant="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          description={passwordRulesHint()}
          autoComplete="new-password"
        />
        {problem ? <InlineError>{problem}</InlineError> : null}
        <Input
          label={t('settingsBody.account.confirmNewPassword')}
          variant="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
        />
        {mismatch ? (
          <InlineError>
            {t('settingsBody.account.passwordsMismatch')}
          </InlineError>
        ) : null}
        {error ? <InlineError aria-live="polite">{error}</InlineError> : null}
        <div>
          <Button type="submit" disabled={!canSubmit}>
            {saving
              ? t('oauthSetPassword.saving')
              : t('oauthSetPassword.submit')}
          </Button>
        </div>
      </form>
    </section>
  );
}
