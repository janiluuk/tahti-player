import { useEffect, useState } from 'react';

import { Button, Dialog } from '@tahti-player/ui';

import { formatLibrarySize } from '../lib/libraryFormat';
import type {
  NativeEditField,
  NativeFieldProvenance,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { formatDuration } from '../lib/playableToTrack';
import { TrackAnalysisSection } from './TrackAnalysisSection';

const blank = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

/** Label/value rows shown in the inspector, in reading order. */
export function inspectorRows(
  track: NativeLibraryTrack,
): Array<{ section: 'Tags' | 'File'; label: string; value: string }> {
  const tag = (label: string, value: string | number | null | undefined) => ({
    section: 'Tags' as const,
    label,
    value: blank(value),
  });
  const file = (label: string, value: string | number | null | undefined) => ({
    section: 'File' as const,
    label,
    value: blank(value),
  });
  return [
    tag('Title', track.title),
    tag('Artist', track.artist),
    tag('Album artist', track.albumArtist),
    tag('Album', track.album),
    tag('Track', track.trackNo),
    tag('Disc', track.discNo),
    tag('Year', track.year),
    tag('Genre', track.genre),
    tag('Comment', track.comment),
    file('Path', track.path),
    file('Format', track.format.toUpperCase()),
    file('Duration', track.duration ? formatDuration(track.duration) : null),
    file('Sample rate', track.sampleRate ? `${track.sampleRate} Hz` : null),
    file('Channels', track.channels || null),
    file(
      'Bit depth',
      track.bitsPerSample ? `${track.bitsPerSample}-bit` : null,
    ),
    file('Bitrate', track.bitrateKbps ? `${track.bitrateKbps} kbps` : null),
    file('Size', formatLibrarySize(track.sizeBytes)),
    file('Added', track.addedAt ? `${track.addedAt} UTC` : null),
    file(
      'Status',
      track.available
        ? 'Available'
        : `Missing since ${track.unavailableSince ?? 'unknown'}`,
    ),
  ];
}

const ROW_FIELD: Record<string, NativeEditField> = {
  Title: 'title',
  Artist: 'artist',
  'Album artist': 'albumArtist',
  Album: 'album',
  Track: 'trackNo',
  Disc: 'discNo',
  Year: 'year',
  Genre: 'genre',
  Comment: 'comment',
};

type Props = {
  /** When given, edited tags show what the file itself says. */
  library?: TahtiNativeLibrary | null;
  track: NativeLibraryTrack | null;
  onClose: () => void;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
  onReveal: (track: NativeLibraryTrack) => void;
  onLocate: (track: NativeLibraryTrack) => void;
  onRemove: (track: NativeLibraryTrack) => void;
  /** Called after analysis or a correction changed the catalog. */
  onChanged?: () => void;
};

/** Everything known about one track, with the actions that apply to it. */
export function TrackInspectorDialog({
  library,
  track,
  onClose,
  onPlay,
  onQueue,
  onReveal,
  onLocate,
  onRemove,
  onChanged,
}: Props) {
  const rows = track ? inspectorRows(track) : [];
  const [provenance, setProvenance] = useState<NativeFieldProvenance[]>([]);
  const trackId = track?.id;
  useEffect(() => {
    setProvenance([]);
    if (!trackId || !library) {
      return;
    }
    let cancelled = false;
    library.catalog
      .provenance(trackId)
      .then((value) => !cancelled && setProvenance(value))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [trackId, library]);
  const edited = new Map(
    provenance.filter((item) => item.edited).map((item) => [item.field, item]),
  );
  const sections = ['Tags', 'File'] as const;
  return (
    <Dialog.Root isOpen={track !== null} onClose={onClose}>
      <Dialog.Title>{track?.title ?? 'Track details'}</Dialog.Title>
      <Dialog.Description>
        {track?.artist || 'Unknown artist'}
      </Dialog.Description>
      <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2">
        {sections.map((section) => (
          <section key={section}>
            <h3 className="mb-1 text-sm font-semibold">{section}</h3>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
              {rows
                .filter((row) => row.section === section)
                .map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-foreground-secondary">{row.label}</dt>
                    <dd className="min-w-0 break-words">
                      {row.value}
                      {row.section === 'Tags' && ROW_FIELD[row.label]
                        ? (() => {
                            const item = edited.get(ROW_FIELD[row.label]!);
                            return item ? (
                              <span className="text-foreground-secondary ml-2 text-xs">
                                Edited · file says {item.fileValue || '(empty)'}
                              </span>
                            ) : null;
                          })()
                        : null}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
        {track && library ? (
          <TrackAnalysisSection
            library={library}
            track={track}
            onChanged={onChanged}
          />
        ) : null}
      </div>
      {track ? (
        <Dialog.Actions>
          {track.available ? (
            <>
              <Button variant="secondary" onClick={() => onPlay(track)}>
                Play
              </Button>
              <Button variant="text" onClick={() => onQueue(track)}>
                Add to queue
              </Button>
              <Button variant="text" onClick={() => onReveal(track)}>
                Reveal in folder
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => onLocate(track)}>
              Locate file
            </Button>
          )}
          <Button
            variant="text"
            intent="danger"
            onClick={() => onRemove(track)}
          >
            Remove
          </Button>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      ) : null}
    </Dialog.Root>
  );
}
