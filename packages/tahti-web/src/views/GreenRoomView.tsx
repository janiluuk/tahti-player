import { useEffect, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import {
  fetchGreenRoomAccess,
  joinGreenRoom,
  type GreenRoomAccess,
} from '../api/artist-settings';
import { fetchProfile } from '../api/client';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { usePlayerStore } from '../stores/playerStore';

/**
 * Guest side of an artist's green room: the invite-only preview stream
 * that runs before a broadcast goes public. Access is decided entirely
 * server-side — this view only reflects the state it is handed.
 */
export function GreenRoomView({ username }: { username: string }) {
  const { t } = useTranslation('web');
  const [access, setAccess] = useState<GreenRoomAccess | null>(null);
  const [channelSlug, setChannelSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
  }, [username, attempt]);

  const checkAgain = (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => setAttempt((n) => n + 1)}
    >
      {t('greenRoom.checkAgain')}
    </Button>
  );

  const backLink = (
    <PageBackLink
      to="/u/$username"
      params={{ username }}
      label={`@${username}`}
    />
  );
  const subtitle = access
    ? `${access.artistDisplayName}'s pre-show preview`
    : 'Invite-only pre-show preview';

  if (loading) {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageLoading label={t('loading.checkingGreenRoomAccess')} />
      </ViewShell>
    );
  }

  if (needsLogin) {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title={t('empties.signInRequired')}
          description={t('empties.logInToJoinThisGreen')}
          action={
            <Button size="sm" onClick={() => openAuth('login')}>
              {t('greenRoom.logIn')}
            </Button>
          }
        />
      </ViewShell>
    );
  }

  if (error || !access) {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="alert"
          title={t('empties.greenRoomUnavailable')}
          description={error ?? i18n.t('web:batch57.couldNotLoadGreenRoom')}
          action={checkAgain}
        />
      </ViewShell>
    );
  }

  if (!access.greenRoomEnabled) {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title={t('empties.notOpenYet')}
          description={`${access.artistDisplayName} has not opened the green room for this broadcast yet.`}
          action={checkAgain}
        />
      </ViewShell>
    );
  }

  if (!access.hasAccess) {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          title={t('empties.inviteRequired')}
          description={t('greenRoomViewLabels.youAreNotOnThe', {
            artistDisplayName: access.artistDisplayName,
          })}
        />
      </ViewShell>
    );
  }

  if (access.channelState === 'LIVE') {
    return (
      <ViewShell
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="radio"
          title={t('empties.onAir')}
          description={`${access.artistDisplayName} is now live — the show has moved to the public channel.`}
          action={
            channelSlug ? (
              <ButtonLink
                className="w-fit"
                to="/channel/$slug"
                params={{ slug: channelSlug }}
                size="sm"
              >
                {t('greenRoom.tuneIn')}
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
        title={t('greenRoom.greenRoom')}
        subtitle={subtitle}
        classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
      >
        {backLink}
        <PageEmpty
          icon="radio"
          title={t('empties.waitingForPreview')}
          description={t('greenRoomViewLabels.theGreenRoomOpensWhen', {
            artistDisplayName: access.artistDisplayName,
          })}
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title={t('greenRoom.greenRoom')}
      subtitle={subtitle}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
    >
      {backLink}
      <div className="border-border bg-background-secondary/40 flex flex-col gap-4 rounded-xl border p-5">
        <p className="text-foreground-secondary text-sm">
          {t('greenRoom.youAposReInThe')}
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
          {t('greenRoom.playPreviewStream')}
        </Button>
      </div>
    </ViewShell>
  );
}
