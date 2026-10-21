import { toast } from 'sonner';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { playableFromNativeTrack } from '../../lib/nativeLibrary';
import { usePlayerStore } from '../../stores/playerStore';

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/** Play, queue and reveal library tracks: resolves each file's path, then hands it to the player. */
export function useNativePlayback(library: TahtiNativeLibrary | null) {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const playNative = async (track: NativeLibraryTrack) => {
    if (!library) {
      return;
    }
    try {
      play(playableFromNativeTrack(track, await library.resolve(track.id)));
    } catch (error) {
      toast.error(messageOf(error, 'Track unavailable.'));
    }
  };

  const queueNative = async (tracks: NativeLibraryTrack[]) => {
    if (!library) {
      return;
    }
    // Resolve every path at once (one IPC round trip each, in parallel), then
    // queue in the original order.
    const resolved = await Promise.allSettled(
      tracks.map((track) => library.resolve(track.id)),
    );
    let queued = 0;
    let failure: string | null = null;
    resolved.forEach((result, index) => {
      const track = tracks[index];
      if (result.status === 'fulfilled' && track) {
        enqueue(playableFromNativeTrack(track, result.value));
        queued += 1;
      } else if (result.status === 'rejected') {
        failure ??= messageOf(result.reason, 'Track unavailable.');
      }
    });
    // One toast, not one per failed track.
    if (failure) {
      toast.error(failure);
    }
    if (queued) {
      toast.success(
        queued === 1
          ? 'Added 1 track to the queue.'
          : `Added ${queued} tracks to the queue.`,
      );
    }
  };

  const revealNative = async (track: NativeLibraryTrack) => {
    if (!library) {
      return;
    }
    try {
      await library.reveal(track.id);
    } catch (error) {
      toast.error(messageOf(error, 'Could not reveal file.'));
    }
  };

  return { playNative, queueNative, revealNative };
}
