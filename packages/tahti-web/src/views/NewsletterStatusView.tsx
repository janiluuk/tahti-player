import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, InlineError } from '@tahti-player/ui';

import { unsubscribeFromNewsletter } from '../api/newsletter-links';

type NewsletterStatus =
  | { kind: 'confirmed' }
  | { kind: 'unsubscribed' }
  | { kind: 'unsubscribe'; token: string };

/** Landing pages for newsletter emails: the API redirects confirmation and
 * one-click unsubscribe links here, and the email footer links to
 * `/newsletter/unsubscribe/$token`. */
export function NewsletterStatusView({ status }: { status: NewsletterStatus }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribe = async (token: string) => {
    setBusy(true);
    setError(null);
    const result = await unsubscribeFromNewsletter(token);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    void navigate({ to: '/newsletter/unsubscribed', replace: true });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <Box variant="tertiary" className="flex flex-col gap-3 p-6">
        {status.kind === 'confirmed' ? (
          <>
            <h1 className="font-display text-2xl font-bold">
              {t('newsletterStatus.youAposReSubscribed')}
            </h1>
            <p className="text-foreground-secondary text-sm">
              {t('newsletterStatus.thanksForConfirmingYouApos')}
            </p>
          </>
        ) : status.kind === 'unsubscribed' ? (
          <>
            <h1 className="font-display text-2xl font-bold">
              {t('newsletterStatus.youAposReUnsubscribed')}
            </h1>
            <p className="text-foreground-secondary text-sm">
              {t('newsletterStatus.youWonAposTGet')}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">
              {t('newsletterStatus.stopTheseEmails')}
            </h1>
            <p className="text-foreground-secondary text-sm">
              {t('newsletterStatus.youAposLlNoLonger')}
            </p>
            {error ? <InlineError>{error}</InlineError> : null}
            <Button
              className="self-start"
              disabled={busy}
              onClick={() => void unsubscribe(status.token)}
            >
              {busy
                ? t('newsletterStatusViewStates.unsubscribing')
                : t('newsletterStatusViewStates.unsubscribe')}
            </Button>
          </>
        )}
      </Box>
      <Link
        to="/"
        className="text-foreground-secondary text-sm hover:underline"
      >
        {t('newsletterStatus.goToTahti')}
      </Link>
    </div>
  );
}
