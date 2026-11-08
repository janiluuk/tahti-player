import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Box,
  Button,
  ButtonAnchor,
  CopyButton,
  Dialog,
} from '@tahti-player/ui';

type MusicBrainzTrack = {
  title: string;
  durationSec?: number | null;
};

type Props = {
  mode: 'track' | 'release';
  title: string;
  artistName: string;
  releaseDate?: string | null;
  barcode?: string | null;
  tracks?: MusicBrainzTrack[];
};

const RELEASE_EDITOR_URL = 'https://musicbrainz.org/release/add';
const RECORDING_EDITOR_URL = 'https://musicbrainz.org/recording/create';

export function MusicBrainzSubmissionAssistant({
  mode,
  title,
  artistName,
  releaseDate,
  barcode,
  tracks = [],
}: Props) {
  const { t } = useTranslation('web');
  const [isOpen, setIsOpen] = useState(false);
  const isRelease = mode === 'release';
  const recordingUrl = `${RECORDING_EDITOR_URL}?edit-recording.name=${encodeURIComponent(title)}`;
  const metadataText = useMemo(
    () =>
      JSON.stringify(
        { title, artist: artistName, releaseDate, barcode, tracks },
        null,
        2,
      ),
    [title, artistName, releaseDate, barcode, tracks],
  );

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
        {isRelease
          ? 'Prepare MusicBrainz release'
          : 'Prepare MusicBrainz track'}
      </Button>
      <Dialog.Root
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>
          {t('musicBrainzAssistant.musicbrainzSubmission')}
        </Dialog.Title>
        <Dialog.Description>
          {t('musicBrainzAssistant.reviewThePreparedMetadataHere')}
        </Dialog.Description>
        <Box
          variant="tertiary"
          className="mt-4 h-auto w-auto flex-col rounded-lg p-3 text-sm"
        >
          <div className="font-medium">{title}</div>
          <div className="text-foreground-secondary">
            {artistName || 'Artist credit not set'}
          </div>
          {releaseDate ? (
            <div className="text-foreground-secondary text-xs">
              {releaseDate}
            </div>
          ) : null}
          {isRelease && tracks.length > 0 ? (
            <ol className="text-foreground-secondary mt-2 list-decimal space-y-1 pl-4 text-xs">
              {tracks.map((track, index) => (
                <li key={`${track.title}-${index}`}>
                  {track.title}
                  {track.durationSec != null
                    ? ` · ${Math.round(track.durationSec)} sec`
                    : ''}
                </li>
              ))}
            </ol>
          ) : null}
        </Box>
        <p className="text-foreground-secondary mt-3 text-xs">
          {t('musicBrainzAssistant.musicbrainzRequiresTheFinalRelease')}
        </p>
        <Dialog.Actions>
          <CopyButton
            text={metadataText}
            size="sm"
            variant="text"
            aria-label={t('musicBrainzAssistant.copyMetadata')}
          />
          {isRelease ? (
            <form action={RELEASE_EDITOR_URL} method="post" target="_blank">
              <input type="hidden" name="name" value={title} />
              <input
                type="hidden"
                name="artist_credit.names.0.name"
                value={artistName}
              />
              {releaseDate ? (
                <input
                  type="hidden"
                  name="date.year"
                  value={releaseDate.slice(0, 4)}
                />
              ) : null}
              {barcode ? (
                <input type="hidden" name="barcode" value={barcode} />
              ) : null}
              {tracks.map((track, index) => (
                <span key={`${track.title}-${index}`}>
                  <input
                    type="hidden"
                    name={`mediums.0.track.${index}.name`}
                    value={track.title}
                  />
                  <input
                    type="hidden"
                    name={`mediums.0.track.${index}.length`}
                    value={
                      track.durationSec == null
                        ? ''
                        : String(Math.round(track.durationSec * 1000))
                    }
                  />
                </span>
              ))}
              <Button
                size="sm"
                type="submit"
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                {t('musicBrainzAssistant.openPrefilledReleaseEditor')}
              </Button>
            </form>
          ) : (
            <ButtonAnchor
              href={recordingUrl}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              {t('musicBrainzAssistant.openPrefilledTrackEditor')}
            </ButtonAnchor>
          )}
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
