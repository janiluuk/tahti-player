import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { InlineLoader, Toggle } from '@tahti-player/ui';

import {
  fetchMusicbrainzDefault,
  saveMusicbrainzDefault,
  type MusicbrainzDefault,
} from '../../../api/musicbrainz-default';

/** Re-enable the post-publish MusicBrainz registration prompt after
 * "Don't ask again" (legacy Settings → Connections had the same toggle). */
export function MusicBrainzOfferToggle() {
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
    return <InlineLoader label="Loading MusicBrainz preference…" />;
  }

  const offered = pref !== false;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Offer MusicBrainz registration
          </p>
          <p className="text-foreground-secondary text-xs">
            After you publish a release, ask whether to register it on
            MusicBrainz.
          </p>
        </div>
        <Toggle
          label="Offer MusicBrainz registration"
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
                    ? 'MusicBrainz registration will be offered again.'
                    : 'MusicBrainz registration won’t be offered after publish.',
                );
              },
            );
          }}
        />
      </div>
    </div>
  );
}
