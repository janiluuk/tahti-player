import { MailIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  fetchNewsletterSubscription,
  setNewsletterSubscription,
  subscribeNewsletterByEmail,
} from '../api/client';
import { webT } from '../lib/webT';
import { useAuthStore } from '../stores/authStore';

type Props = {
  artistUsername: string;
  artistDisplayName: string;
  iconOnly?: boolean;
};

function SignedInToggle({
  artistUsername,
  artistDisplayName,
  iconOnly = false,
}: {
  artistUsername: string;
  artistDisplayName: string;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation('web');
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
          ? t(
              'newsletterSubscribeToggleStates.subscribedYoullGetNotificationsFor',
            )
          : t('newsletterSubscribeToggleStates.unsubscribed'),
      );
    });
  };

  return (
    <Tooltip
      content={
        subscribed
          ? t('newsletterSubscribeToggleStates.subscribedYoullSeeThisArtist')
          : t('newsletterSubscribeToggleStates.subscribeToSeeThisArtist')
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
        aria-label={
          iconOnly
            ? webT()('templateText.subscribeUpdates', {
                name: artistDisplayName,
              })
            : undefined
        }
        onClick={toggle}
      >
        <MailIcon size={14} aria-hidden className={iconOnly ? '' : 'mr-1.5'} />
        {!iconOnly &&
          (subscribed === null
            ? 'Subscribe'
            : subscribed
              ? t('newsletterSubscribeToggleStates.subscribed')
              : t('newsletterSubscribeToggleStates.subscribe'))}
      </Button>
    </Tooltip>
  );
}

function AnonymousForm({
  artistUsername,
  artistDisplayName,
  iconOnly = false,
}: Props) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) {
    return (
      <Tooltip
        content={t('newsletterSubscribeToggle.subscribeByEmailYouRe')}
        side="bottom"
        wrapperClassName="inline-flex"
        multiline
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpen(true)}
          aria-label={t(
            'newsletterSubscribeToggleLabels.emailUpdatesFromArtistdisplayname',
            { artistDisplayName },
          )}
        >
          <MailIcon
            size={14}
            aria-hidden
            className={iconOnly ? '' : 'mr-1.5'}
          />
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
            toast.success(t('toasts.newsletterAlreadySubscribed'));
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
        aria-label={t('newsletterSubscribeToggle.emailAddress')}
        className="min-w-0 sm:w-48"
        autoFocus
      />
      <Button
        size="sm"
        type="submit"
        className="shrink-0"
        disabled={busy || !email.trim()}
      >
        {busy
          ? t('newsletterSubscribeToggleStates.sending')
          : t('newsletterSubscribeToggleStates.subscribe')}
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
    <SignedInToggle
      artistUsername={artistUsername}
      artistDisplayName={artistDisplayName}
      iconOnly={iconOnly}
    />
  ) : (
    <AnonymousForm
      artistUsername={artistUsername}
      artistDisplayName={artistDisplayName}
      iconOnly={iconOnly}
    />
  );
}
