import { useEffect, useState } from 'react';

import { ButtonLink, InlineError, InlineLoader } from '@tahti-player/ui';

import { confirmEmailChange } from '../api/account-credentials';
import { useAuthStore } from '../stores/authStore';

function tokenFromSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

/** Opened from the link sent to a new account address: confirms the change
 * straight away, signed in or not. */
export function EmailChangeView() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<
    | { kind: 'working' }
    | { kind: 'done'; message: string }
    | { kind: 'error'; error: string }
  >({ kind: 'working' });

  useEffect(() => {
    const token = tokenFromSearch().trim();
    if (!token) {
      setState({
        kind: 'error',
        error: 'This link has no token. Open the link from the email again.',
      });
      return;
    }
    let cancelled = false;
    void confirmEmailChange(token).then((result) => {
      if (cancelled) {
        return;
      }
      setState(
        result.ok
          ? { kind: 'done', message: result.message }
          : { kind: 'error', error: result.error },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {state.kind === 'done' ? 'Email changed' : 'Confirm new email'}
      </h1>
      {state.kind === 'working' ? (
        <InlineLoader label="Confirming your new address…" />
      ) : null}
      {state.kind === 'done' ? (
        <>
          <p className="text-sm" role="status">
            {state.message}
          </p>
          <ButtonLink
            to={user ? '/settings/$section' : '/login'}
            params={user ? { section: 'account' } : undefined}
          >
            {user ? 'Back to Settings' : 'Sign in'}
          </ButtonLink>
        </>
      ) : null}
      {state.kind === 'error' ? (
        <>
          <InlineError>{state.error}</InlineError>
          <p className="text-foreground-secondary text-sm">
            Links work once and expire after 24 hours. Ask for a new one in
            Settings → Account → Password &amp; email.
          </p>
        </>
      ) : null}
    </div>
  );
}
