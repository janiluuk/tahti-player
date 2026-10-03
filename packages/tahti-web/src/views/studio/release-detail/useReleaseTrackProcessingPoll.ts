import { fetchStudioRelease } from '../../../api/studio';
import type { StudioReleaseTrack } from '../../../api/studio-types';
import { isReleaseTrackProcessing } from '../../../api/studio/release-track-upload';
import { usePolling } from '../../../hooks/usePolling';

const PROCESSING_POLL_MS = 10_000;

/** While any track is scanning or transcoding, re-read the release and hand
 * back each track's processing fields so the list can settle on ready or
 * failed. */
export function useReleaseTrackProcessingPoll(
  releaseId: string,
  tracks: StudioReleaseTrack[],
  onRefreshed: (
    updates: Map<
      string,
      Pick<StudioReleaseTrack, 'status' | 'sourceKey' | 'durationSec'>
    >,
  ) => void,
) {
  usePolling(
    () => {
      void fetchStudioRelease(releaseId).then((result) => {
        if (!result.ok) {
          return;
        }
        onRefreshed(
          new Map(
            (result.data.tracks ?? []).map((track) => [
              track.id,
              {
                status: track.status,
                sourceKey: track.sourceKey,
                durationSec: track.durationSec,
              },
            ]),
          ),
        );
      });
    },
    PROCESSING_POLL_MS,
    tracks.some((track) => isReleaseTrackProcessing(track.status)),
  );
}
