import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { InlineLoader, Toggle } from '@tahti-player/ui';

import {
  fetchMusicbrainzDefault,
  saveMusicbrainzDefault,
  type MusicbrainzDefault,
} from '../../../api/musicbrainz-default';

/** Re-enable the post-publish MusicBrainz registration prompt after
 * "Don't ask again" (legacy Settings → Connections had the same toggle). */
export function MusicBrainzOfferToggle() {
  const { t } = useTranslation('web');
  const [pref, setPref] = useState<MusicbrainzDefault | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMusicbrainzDefault().then(({ data }) => {
      if (!cancelled) {
        setPref(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pref === undefined) {
    return <InlineLoader label={t('toggles.musicbrainz.loading')} />;
  }

  const offered = pref !== false;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t('toggles.musicbrainz.label')}
          </p>
          <p className="text-foreground-secondary text-xs">
            {t('toggles.musicbrainz.description')}
          </p>
        </div>
        <Toggle
          label={t('toggles.musicbrainz.label')}
          checked={offered}
          disabled={saving}
          onChange={(checked) => {
            setSaving(true);
            void saveMusicbrainzDefault(checked ? null : false).then(
              (result) => {
                setSaving(false);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                setPref(checked ? null : false);
                toast.success(
                  checked
                    ? t('toggles.musicbrainz.offeredAgain')
                    : t('toggles.musicbrainz.notOffered'),
                );
              },
            );
          }}
        />
      </div>
    </div>
  );
}
