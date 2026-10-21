import { useCallback, useEffect, useRef, useState } from 'react';

import {
  uploadReleaseTrackAudio,
  type ReleaseTrackUploadResult,
} from '../../../api/studio/release-track-upload';

/** One in-flight release track upload: progress (0-1) and cancel. */
export function useReleaseTrackUpload() {
  const [progress, setProgress] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const upload = useCallback(
    async (
      releaseId: string,
      trackId: string,
      file: File,
    ): Promise<ReleaseTrackUploadResult> => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setProgress(0);
      const result = await uploadReleaseTrackAudio(releaseId, trackId, file, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setProgress(null);
      }
      return result;
    },
    [],
  );

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return {
    uploading: progress !== null,
    progress: progress ?? 0,
    upload,
    cancel,
  };
}
