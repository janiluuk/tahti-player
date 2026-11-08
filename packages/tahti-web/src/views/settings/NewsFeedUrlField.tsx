import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Input, SaveButton } from '@tahti-player/ui';

import { fetchMeProfile, patchMeProfile } from '../../api/studio-extras';
import { SettingsHint } from './SettingsFields';

export function NewsFeedUrlField() {
  const { t } = useTranslation('web');
  const [url, setUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMeProfile().then(({ data }) => {
      if (!cancelled) {
        setUrl(data.newsFeedUrl ?? '');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (url === null) {
    return null;
  }

  const save = async () => {
    setSaving(true);
    const result = await patchMeProfile({ newsFeedUrl: url.trim() });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUrl(result.data.newsFeedUrl ?? '');
    toast.success(
      url.trim() ? 'News feed saved.' : 'News feed removed from your page.',
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-foreground text-sm font-semibold">
          {t('newsFeedUrlField.newsFeed')}
        </p>
        <SettingsHint>{t('newsFeedUrlField.anRssOrAtomFeed')}</SettingsHint>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('newsFeedUrlField.feedUrl')}
          value={url}
          placeholder="https://example.com/feed.xml"
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex justify-end">
          <SaveButton
            label={t('newsFeedUrlField.saveNewsFeed')}
            saving={saving}
            type="submit"
          />
        </div>
      </form>
    </section>
  );
}
