import { useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';

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
        ? 'MusicBrainz registration will be offered for every release.'
        : 'MusicBrainz registration won’t be offered again. It stays in the Export tab.',
    );
  };

  return (
    <Alert tone="neutral" title="Register this release on MusicBrainz">
      <div className="flex flex-col gap-2">
        <span>
          MusicBrainz is the open music database that players and stores use to
          identify releases.
        </span>
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
                Always offer this
              </Button>
              <Button
                size="sm"
                variant="text"
                disabled={saving}
                onClick={() => void save(false)}
              >
                Don’t ask again
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="text"
              disabled={saving}
              onClick={() => void save(false)}
            >
              Stop offering
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
