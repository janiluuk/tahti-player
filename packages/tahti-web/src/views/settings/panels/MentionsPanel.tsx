import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, MediaArtwork } from '@tahti-player/ui';

import {
  fetchMentions,
  fetchMentionSettings,
  mentionerName,
  mentionSurfaceLabel,
  patchMentionSettings,
  setMentionMute,
  type Mention,
  type MentionSettings,
} from '../../../api/me-mentions';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint, SettingsToggle } from '../SettingsFields';

export function MentionsPanel() {
  const closeSettings = useSettingsModalStore((state) => state.close);
  const [settings, setSettings] = useState<MentionSettings | null>(null);
  const [mentions, setMentions] = useState<Mention[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        setSettings(settingsResult.data);
        setMentions(mentionsResult.ok ? mentionsResult.data : []);
      },
    );
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <SettingsHint>{error}</SettingsHint>;
  }
  if (!settings || !mentions) {
    return <SettingsHint>Loading…</SettingsHint>;
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
      toast.success('Mention setting saved.');
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
        title="Mentions"
        description="When another artist tags you as @username in a bio, release, announcement, newsletter, tracklist or chat."
      >
        <div className="flex flex-col gap-3">
          <SettingsToggle
            label="Let artists mention me"
            value={settings.mentionsEnabled}
            onChange={(value) => toggle('mentionsEnabled', value)}
          />
          <SettingsToggle
            label="Show mentions on my public profile"
            value={settings.publicMentionsEnabled}
            onChange={(value) => toggle('publicMentionsEnabled', value)}
          />
        </div>
      </StudioPanel>

      <StudioPanel title="Recent mentions">
        {mentions.length === 0 ? (
          <SettingsHint>Nobody has mentioned you yet.</SettingsHint>
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
                  <span className="text-foreground-secondary">
                    mentioned you in {mentionSurfaceLabel(mention.surface)}
                  </span>
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
                  Mute
                </Button>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>

      <StudioPanel
        title="Muted"
        description="Mentions from these people don't reach you."
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
                  Unmute
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
            label="Mute a username"
            placeholder="@username"
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
            Mute
          </Button>
        </form>
        {muteError ? (
          <p className="text-accent-red-strong mt-2 text-sm" role="alert">
            {muteError}
          </p>
        ) : null}
      </StudioPanel>
    </div>
  );
}
