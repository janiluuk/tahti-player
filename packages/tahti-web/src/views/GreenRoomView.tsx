import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import {
  fetchGreenRoomAccess,
  joinGreenRoom,
  type GreenRoomAccess,
} from '../api/artist-settings';
import { fetchProfile } from '../api/client';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { usePlayerStore } from '../stores/playerStore';

/**
 * Guest side of an artist's green room: the invite-only preview stream
 * that runs before a broadcast goes public. Access is decided entirely
 * server-side — this view only reflects the state it is handed.
 */
export function GreenRoomView({ username }: { username: string }) {
  const [access, setAccess] = useState<GreenRoomAccess | null>(null);
  const [channelSlug, setChannelSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAuth = useAuthModalStore((s) => s.open);
  const play = usePlayerStore((s) => s.play);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeedsLogin(false);

    void (async () => {
      const profile = await fetchProfile(username);
      const slug = profile.data?.channel?.slug;
      if (cancelled) {
        return;
      }
      if (!slug) {
        setError('This artist has no channel.');
        setLoading(false);
        return;
      }
      setChannelSlug(slug);

      const result = await fetchGreenRoomAccess(slug);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setNeedsLogin(result.needsLogin);
        setError(result.error);
        setLoading(false);
        return;
      }

      // Joining is what puts the listener on the artist's guest list view,
      // so do it once as soon as we know they're allowed in.
      if (result.data.hasAccess && !result.data.joinedAt) {
        const joined = await joinGreenRoom(slug);
        if (!cancelled && joined) {
          setAccess(joined);
          setLoading(false);
          return;
        }
      }
      setAccess(result.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const backLink = (
    <Link
      to="/u/$username"
      params={{ username }}
      className="text-foreground-secondary mb-2 block text-xs hover:underline"
    >
      ← @{username}
    </Link>
  );
  const subtitle = access
    ? `${access.artistDisplayName}'s pre-show preview`
    : 'Invite-only pre-show preview';

  if (loading) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageLoading label="Checking green room access…" />
      </ViewShell>
    );
  }

  if (needsLogin) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title="Sign in required"
          description="Log in to join this green room."
          action={
            <Button size="sm" onClick={() => openAuth('login')}>
              Log in
            </Button>
          }
        />
      </ViewShell>
    );
  }

  if (error || !access) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="alert"
          title="Green room unavailable"
          description={error ?? 'Could not load green room access.'}
        />
      </ViewShell>
    );
  }

  if (!access.greenRoomEnabled) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title="Not open yet"
          description={`${access.artistDisplayName} has not opened the green room for this broadcast yet.`}
        />
      </ViewShell>
    );
  }

  if (!access.hasAccess) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title="Invite required"
          description={`You are not on the guest list for ${access.artistDisplayName}'s green room.`}
        />
      </ViewShell>
    );
  }

  if (access.channelState === 'LIVE') {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="radio"
          title="On air"
          description={`${access.artistDisplayName} is now live — the show has moved to the public channel.`}
          action={
            channelSlug ? (
              <ButtonLink
                className="w-fit"
                to="/channel/$slug"
                params={{ slug: channelSlug }}
                size="sm"
              >
                Tune in
              </ButtonLink>
            ) : undefined
          }
        />
      </ViewShell>
    );
  }

  if (access.channelState !== 'PREVIEW' || !access.hlsUrl) {
    return (
      <ViewShell
        title="Green room"
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="radio"
          title="Waiting for preview"
          description={`The green room opens when ${access.artistDisplayName} starts their preview stream.`}
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title="Green room"
      subtitle={subtitle}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
    >
      {backLink}
      <div className="border-border bg-background-secondary/40 flex flex-col gap-4 rounded-xl border p-5">
        <p className="text-foreground-secondary text-sm">
          You&apos;re in the green room — listen to the preview stream before
          the show goes public.
        </p>
        <Button
          onClick={() =>
            play({
              id: `green-room:${channelSlug}`,
              kind: 'live',
              title: `${access.artistDisplayName} — green room preview`,
              artist: access.artistDisplayName,
              streamUrl: access.hlsUrl!,
              protocol: 'hls',
              channelSlug: channelSlug ?? undefined,
            })
          }
        >
          Play preview stream
        </Button>
      </div>
    </ViewShell>
  );
}
