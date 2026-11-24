import { CellContext } from '@tanstack/react-table';

import { Artwork, Track } from '@tahti-player/model';

import { MediaArtwork } from '../../MediaArtwork';
import { useTrackTableContext } from '../TrackTableContext';

export const ThumbnailCell = <T extends Track>({
  getValue,
  row,
  table,
}: CellContext<T, Artwork>) => {
  const { actions, labels } = useTrackTableContext<T>();
  const track = row.original;
  const artwork = getValue();
  const meta = table.options.meta as
    | {
        isTrackPlaying?: (candidate: T) => boolean;
        canPlayTrack?: (track: T) => boolean;
        isCurrentTrack?: (candidate: T) => boolean;
      }
    | undefined;
  const isPlaying = meta?.isTrackPlaying?.(track) ?? false;
  const isCurrent = meta?.isCurrentTrack?.(track) ?? isPlaying;

  return (
    <td className="w-16 p-0 text-center">
      <div className="flex w-full justify-center">
        <MediaArtwork
          size="md"
          src={artwork?.url}
          alt={track.title}
          imageReveal={false}
          onPlay={
            actions.onPlayNow
              ? () => {
                  actions.onPlayNow?.(track);
                }
              : undefined
          }
          onQueue={
            actions.onAddToQueue && meta?.canPlayTrack?.(track) !== false
              ? () => {
                  actions.onAddToQueue?.(track);
                }
              : undefined
          }
          queueLabel={`${labels.addToQueue} ${track.title}`}
          playLabel={`${labels.play} ${track.title}`}
          pauseLabel={`${labels.pause} ${track.title}`}
          playDisabled={meta?.canPlayTrack?.(track) === false}
          isPlaying={isPlaying}
          isCurrent={isCurrent}
          hideActivePlay
        />
      </div>
    </td>
  );
};
