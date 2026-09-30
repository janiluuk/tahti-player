import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Box, Button } from '@tahti-player/ui';

import { unsubscribeFromNewsletter } from '../api/newsletter-links';

type NewsletterStatus =
  | { kind: 'confirmed' }
  | { kind: 'unsubscribed' }
  | { kind: 'unsubscribe'; token: string };

/** Landing pages for newsletter emails: the API redirects confirmation and
 * one-click unsubscribe links here, and the email footer links to
 * `/newsletter/unsubscribe/$token`. */
export function NewsletterStatusView({ status }: { status: NewsletterStatus }) {
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
      <Box className="flex flex-col gap-3 p-6">
        {status.kind === 'confirmed' ? (
          <>
            <h1 className="font-display text-2xl font-bold">
              You&apos;re subscribed
            </h1>
            <p className="text-foreground-secondary text-sm">
              Thanks for confirming. You&apos;ll get the artist&apos;s updates
              by email, and every email has a link to stop them.
            </p>
          </>
        ) : status.kind === 'unsubscribed' ? (
          <>
            <h1 className="font-display text-2xl font-bold">
              You&apos;re unsubscribed
            </h1>
            <p className="text-foreground-secondary text-sm">
              You won&apos;t get this artist&apos;s newsletter any more. You can
              subscribe again from their page.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">
              Stop these emails?
            </h1>
            <p className="text-foreground-secondary text-sm">
              You&apos;ll no longer get this artist&apos;s newsletter.
            </p>
            {error ? (
              <p className="text-accent-red-strong text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              className="self-start"
              disabled={busy}
              onClick={() => void unsubscribe(status.token)}
            >
              {busy ? 'Unsubscribing…' : 'Unsubscribe'}
            </Button>
          </>
        )}
      </Box>
      <Link
        to="/"
        className="text-foreground-secondary text-sm hover:underline"
      >
        Go to Tahti
      </Link>
    </div>
  );
}
