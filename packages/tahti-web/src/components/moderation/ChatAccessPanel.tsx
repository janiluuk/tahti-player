import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  fetchChatSettings,
  setChatSubscribersOnly,
} from '../../api/artist-settings';
import { SettingsToggle } from '../../views/settings/SettingsFields';
import { StudioPanel } from '../StudioPanel';

/** Who may post in the channel chat. Renders nothing until the setting has
 * loaded, or when the API has no chat settings for this account. */
export function ChatAccessPanel() {
  const { t } = useTranslation('web');
  const [subscribersOnly, setSubscribersOnly] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchChatSettings().then((result) => {
      if (!cancelled) {
        setSubscribersOnly(result.data?.subscribersOnly ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const change = (next: boolean) => {
    setSaving(true);
    void setChatSubscribersOnly(next).then((result) => {
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSubscribersOnly(result.subscribersOnly);
      toast.success(
        result.subscribersOnly
          ? t('chatAccessPanel.subscribersOnlySaved')
          : t('chatAccessPanel.everyoneCanPostSaved'),
      );
    });
  };

  if (subscribersOnly === null) {
    return null;
  }

  return (
    <StudioPanel
      title={t('chatAccessPanel.chatAccess')}
      description={t('chatAccessPanel.turnThisOnToLet')}
    >
      <SettingsToggle
        label={t('chatAccessPanel.onlyFanSubscribersCanPost')}
        value={subscribersOnly}
        disabled={saving}
        onChange={change}
      />
    </StudioPanel>
  );
}
