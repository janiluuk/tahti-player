import { useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button } from '@tahti-player/ui';

import {
  fetchMusicbrainzDefault,
  saveMusicbrainzDefault,
  type MusicbrainzDefault,
} from '../api/musicbrainz-default';
import { MusicBrainzSubmissionAssistant } from './MusicBrainzSubmissionAssistant';

type AssistantProps = Omit<
  ComponentProps<typeof MusicBrainzSubmissionAssistant>,
  'mode'
>;

/** After a release is published: offer to register it on MusicBrainz,
 * remembering "always offer" / "don't ask again" for the next release
 * (`/api/me/musicbrainz/default`, as the legacy release page did). */
export function MusicBrainzRegisterPrompt(props: AssistantProps) {
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

  if (pref === undefined || pref === false) {
    return null;
  }

  const save = async (value: boolean) => {
    setSaving(true);
    const result = await saveMusicbrainzDefault(value);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPref(value);
    toast.success(
      value
        ? t(
            'musicBrainzRegisterPromptStates.musicbrainzRegistrationWillBeOffered',
          )
        : t(
            'musicBrainzRegisterPromptStates.musicbrainzRegistrationWontBeOffered',
          ),
    );
  };

  return (
    <Alert
      tone="neutral"
      title={t('musicBrainzRegister.registerThisReleaseOnMusicbrainz')}
    >
      <div className="flex flex-col gap-2">
        <span>{t('musicBrainzRegister.musicbrainzIsTheOpenMusic')}</span>
        <div className="flex flex-wrap items-center gap-2">
          <MusicBrainzSubmissionAssistant mode="release" {...props} />
          {pref === null ? (
            <>
              <Button
                size="sm"
                variant="text"
                disabled={saving}
                onClick={() => void save(true)}
              >
                {t('musicBrainzRegister.alwaysOfferThis')}
              </Button>
              <Button
                size="sm"
                variant="text"
                disabled={saving}
                onClick={() => void save(false)}
              >
                {t('musicBrainzRegister.donTAskAgain')}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="text"
              disabled={saving}
              onClick={() => void save(false)}
            >
              {t('musicBrainzRegister.stopOffering')}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
