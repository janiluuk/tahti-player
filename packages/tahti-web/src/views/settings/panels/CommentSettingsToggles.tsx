import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchCommentSettings,
  setChannelCommentsEnabled,
  setNewChannelCommentsEnabled,
  setNewUploadCommentsEnabled,
  type CommentSettings,
} from '../../../api/comment-settings';
import { SettingsToggle } from '../SettingsFields';

export function CommentSettingsToggles() {
  const [settings, setSettings] = useState<CommentSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchCommentSettings().then((result) => {
      if (!cancelled && result.ok) {
        setSettings(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) {
    return null;
  }

  const save = (
    key: keyof CommentSettings,
    value: boolean,
    request: (
      value: boolean,
    ) => Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }>,
  ) => {
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    void request(value).then((result) => {
      if (!result.ok) {
        setSettings(previous);
        toast.error(result.error);
        return;
      }
      setSettings((current) =>
        current ? { ...current, [key]: result.enabled } : current,
      );
      toast.success('Comment setting saved.');
    });
  };

  return (
    <>
      {settings.channelCommentsEnabled !== null ? (
        <SettingsToggle
          label="Allow comments on my channel"
          description="Listeners can leave comments on your channel page."
          value={settings.channelCommentsEnabled}
          onChange={(value) =>
            save('channelCommentsEnabled', value, setChannelCommentsEnabled)
          }
        />
      ) : (
        // The channel default only applies when the channel is created, so
        // once a channel exists the live switch above replaces it.
        <SettingsToggle
          label="Allow comments on my channel when it is created"
          description="Your channel starts with comments on or off when you set it up. You can change it afterwards."
          value={settings.newChannelCommentsEnabled}
          onChange={(value) =>
            save(
              'newChannelCommentsEnabled',
              value,
              setNewChannelCommentsEnabled,
            )
          }
        />
      )}
      <SettingsToggle
        label="Allow comments on my new uploads"
        description="Tracks you upload from now on start with comments on. Each track keeps its own setting afterwards."
        value={settings.newUploadCommentsEnabled}
        onChange={(value) =>
          save('newUploadCommentsEnabled', value, setNewUploadCommentsEnabled)
        }
      />
    </>
  );
}
