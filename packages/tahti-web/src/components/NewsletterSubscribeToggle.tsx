import { MailIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  fetchNewsletterSubscription,
  setNewsletterSubscription,
  subscribeNewsletterByEmail,
} from '../api/client';
import { useAuthStore } from '../stores/authStore';

type Props = {
  artistUsername: string;
  artistDisplayName: string;
  iconOnly?: boolean;
};

function SignedInToggle({
  artistUsername,
  iconOnly = false,
}: {
  artistUsername: string;
  iconOnly?: boolean;
}) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchNewsletterSubscription(artistUsername).then((r) => {
      if (!cancelled) {
        setSubscribed(r.subscribed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [artistUsername]);

  const toggle = () => {
    if (subscribed === null || busy) {
      return;
    }
    setBusy(true);
    const next = !subscribed;
    void setNewsletterSubscription(artistUsername, next).then((r) => {
      setBusy(false);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setSubscribed(r.subscribed);
      toast.success(
        r.subscribed
          ? 'Subscribed — you’ll get notifications for newsletters, events, and other activity.'
          : 'Unsubscribed.',
      );
    });
  };

  return (
    <Tooltip
      content={
        subscribed
          ? 'Subscribed — you’ll see this artist in your feed and notifications. Click to unsubscribe.'
          : 'Subscribe to see this artist in your feed and notifications'
      }
      side="bottom"
      wrapperClassName="inline-flex"
      multiline
    >
      <Button
        size="sm"
        variant={subscribed ? 'default' : 'secondary'}
        disabled={subscribed === null || busy}
        aria-pressed={subscribed ?? false}
        onClick={toggle}
      >
        <MailIcon size={14} aria-hidden className="mr-1.5" />
        {!iconOnly &&
          (subscribed === null
            ? 'Subscribe'
            : subscribed
              ? 'Subscribed'
              : 'Subscribe')}
      </Button>
    </Tooltip>
  );
}

function AnonymousForm({
  artistUsername,
  artistDisplayName,
  iconOnly = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) {
    return (
      <Tooltip
        content="Subscribe by email — you're not signed in"
        side="bottom"
        wrapperClassName="inline-flex"
        multiline
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpen(true)}
          aria-label={`Subscribe to ${artistDisplayName}`}
        >
          <MailIcon size={14} aria-hidden className="mr-1.5" />
          {!iconOnly && 'Subscribe'}
        </Button>
      </Tooltip>
    );
  }

  if (sent) {
    return (
      <p className="text-foreground-secondary text-xs">
        Check your email to confirm — you&apos;ll then get notifications for
        {` ${artistDisplayName}`}&apos;s newsletters, events, and activity.
      </p>
    );
  }

  return (
    <form
      className="flex w-full basis-full items-center gap-2 sm:w-auto sm:basis-auto"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void subscribeNewsletterByEmail(email, artistUsername).then((r) => {
          setBusy(false);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          if (r.alreadySubscribed) {
            toast.success('You’re already subscribed.');
            setOpen(false);
            return;
          }
          setSent(true);
        });
      }}
    >
      <Input
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className="min-w-0 sm:w-48"
        autoFocus
      />
      <Button
        size="sm"
        type="submit"
        className="shrink-0"
        disabled={busy || !email.trim()}
      >
        {busy ? 'Sending…' : 'Subscribe'}
      </Button>
    </form>
  );
}

/** Notifications (+ optional email) for an artist's newsletters, events,
 * and other activity — a single toggle for signed-in listeners (visible
 * on/off state), or a double opt-in email form for anonymous visitors. */
export function NewsletterSubscribeToggle({
  artistUsername,
  artistDisplayName,
  iconOnly = false,
}: Props) {
  const signedIn = Boolean(useAuthStore((s) => s.user));
  return signedIn ? (
    <SignedInToggle artistUsername={artistUsername} iconOnly={iconOnly} />
  ) : (
    <AnonymousForm
      artistUsername={artistUsername}
      artistDisplayName={artistDisplayName}
      iconOnly={iconOnly}
    />
  );
}
