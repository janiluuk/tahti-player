import { CellContext } from '@tanstack/react-table';
import { Music } from 'lucide-react';

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
      }
    | undefined;
  const isPlaying = meta?.isTrackPlaying?.(track) ?? false;

  return (
    <td className="w-14 text-center">
      <div className="flex w-full justify-center">
        <MediaArtwork
          size="thumb"
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
            actions.onAddToQueue
              ? () => {
                  actions.onAddToQueue?.(track);
                }
              : undefined
          }
          queueLabel={`${labels.addToQueue} ${track.title}`}
          playLabel={`${labels.play} ${track.title}`}
          pauseLabel={`${labels.pause} ${track.title}`}
          isPlaying={isPlaying}
          placeholder={
            <Music size={16} absoluteStrokeWidth className="opacity-20" />
          }
        />
      </div>
    </td>
  );
};
