import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  InlineError,
  InlineLoader,
  Input,
  MediaArtwork,
} from '@tahti-player/ui';

import {
  fetchMentions,
  fetchMentionSettings,
  mentionerName,
  mentionSourcePath,
  mentionSourceTitle,
  patchMentionSettings,
  setMentionMute,
  type Mention,
  type MentionSettings,
  type MentionSurface,
} from '../../../api/me-mentions';
import { PageEmpty, PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsToggle } from '../SettingsFields';

const SURFACE_KEYS: Record<MentionSurface, string> = {
  BIO: 'settingsBody.account.mentionSurfaceBio',
  RELEASE: 'settingsBody.account.mentionSurfaceRelease',
  ANNOUNCEMENT: 'settingsBody.account.mentionSurfaceAnnouncement',
  NEWSLETTER: 'settingsBody.account.mentionSurfaceNewsletter',
  TRACKLIST: 'settingsBody.account.mentionSurfaceTracklist',
  CHAT: 'settingsBody.account.mentionSurfaceChat',
  DISCUSSION: 'settingsBody.account.mentionSurfaceDiscussion',
};

function MentionSource({
  mention,
  onOpen,
}: {
  mention: Mention;
  onOpen: () => void;
}) {
  const { t } = useTranslation('web');
  const surfaceKey =
    SURFACE_KEYS[mention.surface as MentionSurface] ??
    'settingsBody.account.mentionSurfacePost';
  const label = t(surfaceKey as 'settingsBody.account.mentionSurfacePost');
  const path = mentionSourcePath(mention);
  const title = mentionSourceTitle(mention);
  if (!path) {
    return (
      <span className="text-foreground-secondary">
        {t('settingsBody.account.mentionsYouIn')} {label}
      </span>
    );
  }
  return (
    <span className="text-foreground-secondary">
      {t('settingsBody.account.mentionsYouIn')}{' '}
      <Link
        to={path as never}
        onClick={onOpen}
        className="text-foreground underline underline-offset-2"
      >
        {title ? `${label}: ${title}` : label}
      </Link>
    </span>
  );
}

export function MentionsPanel() {
  const { t } = useTranslation('web');
  const closeSettings = useSettingsModalStore((state) => state.close);
  const [settings, setSettings] = useState<MentionSettings | null>(null);
  const [mentions, setMentions] = useState<Mention[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mentionsError, setMentionsError] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [muteError, setMuteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void Promise.all([fetchMentionSettings(), fetchMentions()]).then(
      ([settingsResult, mentionsResult]) => {
        if (!settingsResult.ok) {
          setError(settingsResult.error);
          return;
        }
        setError(null);
        setSettings(settingsResult.data);
        setMentionsError(mentionsResult.ok ? null : mentionsResult.error);
        setMentions(mentionsResult.ok ? mentionsResult.data : []);
      },
    );
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <PageError
        title={t('settingsBody.account.mentionsSettingsLoadError')}
        description={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );
  }
  if (!settings || !mentions) {
    return <InlineLoader label={t('settingsBody.loading')} />;
  }

  const toggle = (
    key: 'mentionsEnabled' | 'publicMentionsEnabled',
    value: boolean,
  ) => {
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    void patchMentionSettings({ [key]: value }).then((result) => {
      if (!result.ok) {
        setSettings(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t('settingsBody.account.mentionsSaved'));
    });
  };

  const mute = (username: string, muted: boolean) => {
    setBusy(true);
    setMuteError(null);
    void setMentionMute(username, muted).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setMuteError(result.error);
        return;
      }
      if (muted) {
        setHandle('');
      }
      load();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <StudioPanel
        title={t('settingsBody.account.mentionsTitle')}
        description={t('settingsBody.account.mentionsDescription')}
      >
        <div className="flex flex-col gap-3">
          <SettingsToggle
            label={t('settingsBody.account.mentionsEnabled')}
            value={settings.mentionsEnabled}
            onChange={(value) => toggle('mentionsEnabled', value)}
          />
          <SettingsToggle
            label={t('settingsBody.account.mentionsPublic')}
            value={settings.publicMentionsEnabled}
            onChange={(value) => toggle('publicMentionsEnabled', value)}
          />
        </div>
      </StudioPanel>

      <StudioPanel title={t('settingsBody.account.mentionsRecent')}>
        {mentionsError ? (
          <PageError
            title={t('settingsBody.account.mentionsLoadError')}
            description={mentionsError}
            onRetry={load}
          />
        ) : mentions.length === 0 ? (
          <PageEmpty title={t('settingsBody.account.mentionsEmpty')} />
        ) : (
          <ul className="divide-border divide-y">
            {mentions.map((mention) => (
              <li
                key={mention.id}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <MediaArtwork
                  src={mention.mentioner.avatarUrl}
                  alt=""
                  size="sm"
                  className="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/u/$username"
                    params={{ username: mention.mentioner.username }}
                    onClick={closeSettings}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {mentionerName(mention.mentioner)}
                  </Link>{' '}
                  <MentionSource mention={mention} onOpen={closeSettings} />
                  <div className="text-foreground-secondary text-xs">
                    {humanizePastDate(mention.createdAt)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="text"
                  disabled={
                    busy ||
                    settings.muted.some(
                      (item) => item.username === mention.mentioner.username,
                    )
                  }
                  onClick={() => mute(mention.mentioner.username, true)}
                >
                  {t('settingsBody.account.mentionsMute')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>

      <StudioPanel
        title={t('settingsBody.account.mentionsMutedTitle')}
        description={t('settingsBody.account.mentionsMutedDescription')}
      >
        {settings.muted.length > 0 ? (
          <ul className="divide-border divide-y">
            {settings.muted.map((item) => (
              <li
                key={item.username}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  {item.displayName && !item.displayName.includes('@')
                    ? item.displayName
                    : item.username}{' '}
                  <span className="text-foreground-secondary">
                    @{item.username}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="text"
                  disabled={busy}
                  onClick={() => mute(item.username, false)}
                >
                  {t('settingsBody.account.mentionsUnmute')}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <form
          className={`flex flex-wrap items-end gap-2 ${settings.muted.length > 0 ? 'mt-3' : ''}`}
          onSubmit={(event) => {
            event.preventDefault();
            mute(handle, true);
          }}
        >
          <Input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('settingsBody.account.mentionsMuteUsername')}
            placeholder={t('settingsBody.account.mentionsMutePlaceholder')}
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            className="max-w-xs"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={busy || !handle.trim()}
          >
            {t('settingsBody.account.mentionsMute')}
          </Button>
        </form>
        {muteError ? (
          <InlineError className="mt-2">{muteError}</InlineError>
        ) : null}
      </StudioPanel>
    </div>
  );
}
