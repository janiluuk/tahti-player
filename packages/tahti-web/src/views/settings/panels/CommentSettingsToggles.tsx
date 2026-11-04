import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  fetchCommentSettings,
  setChannelCommentsEnabled,
  setNewChannelCommentsEnabled,
  setNewUploadCommentsEnabled,
  type CommentSettings,
} from '../../../api/comment-settings';
import { PageError } from '../../../components/PageStates';
import { SettingsToggle } from '../SettingsFields';

export function CommentSettingsToggles() {
  const { t } = useTranslation('web');
  const [settings, setSettings] = useState<CommentSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchCommentSettings().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setLoadError(null);
        setSettings(result.data);
        return;
      }
      setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (!settings && loadError) {
    return (
      <PageError
        title={t('toggles.comments.loadError')}
        description={loadError}
        onRetry={() => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

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
      toast.success(t('toggles.comments.saved'));
    });
  };

  return (
    <>
      {settings.channelCommentsEnabled !== null ? (
        <SettingsToggle
          label={t('toggles.comments.channelLabel')}
          description={t('toggles.comments.channelDescription')}
          value={settings.channelCommentsEnabled}
          onChange={(value) =>
            save('channelCommentsEnabled', value, setChannelCommentsEnabled)
          }
        />
      ) : (
        // The channel default only applies when the channel is created, so
        // once a channel exists the live switch above replaces it.
        <SettingsToggle
          label={t('toggles.comments.newChannelLabel')}
          description={t('toggles.comments.newChannelDescription')}
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
        label={t('toggles.comments.uploadsLabel')}
        description={t('toggles.comments.uploadsDescription')}
        value={settings.newUploadCommentsEnabled}
        onChange={(value) =>
          save('newUploadCommentsEnabled', value, setNewUploadCommentsEnabled)
        }
      />
    </>
  );
}
