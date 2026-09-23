import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { MAX_HEADER_VIDEO_BYTES } from '../../api/channel-design';
import { HEADER_MEDIA_TYPES } from './slideshowOptions';

/** A backdrop video/image picked for upload on the next save, plus its blob
 * preview URL (revoked whenever the file is replaced, dropped, or the
 * designer unmounts). */
export function usePendingBackdropFile(markDirty: () => void) {
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [pendingVideoPreviewUrl, setPendingVideoPreviewUrl] = useState<
    string | null
  >(null);

  const pendingPreviewUrlRef = useRef<string | null>(null);
  pendingPreviewUrlRef.current = pendingVideoPreviewUrl;
  useEffect(
    () => () => {
      if (pendingPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewUrlRef.current);
      }
    },
    [],
  );

  const selectVideoFile = (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_HEADER_VIDEO_BYTES) {
      toast.error('File must be 10 MB or smaller.');
      return;
    }
    if (!HEADER_MEDIA_TYPES.includes(file.type)) {
      toast.error('Use an MP4/WebM video or a JPEG/PNG/WebP/GIF image.');
      return;
    }
    if (pendingVideoPreviewUrl) {
      URL.revokeObjectURL(pendingVideoPreviewUrl);
    }
    setPendingVideoFile(file);
    setPendingVideoPreviewUrl(URL.createObjectURL(file));
    markDirty();
  };

  /** Drops a picked-but-not-uploaded backdrop file (and its blob URL). */
  const discardPendingVideo = () => {
    if (pendingPreviewUrlRef.current) {
      URL.revokeObjectURL(pendingPreviewUrlRef.current);
    }
    setPendingVideoFile(null);
    setPendingVideoPreviewUrl(null);
  };

  return {
    pendingVideoFile,
    pendingVideoPreviewUrl,
    selectVideoFile,
    discardPendingVideo,
  };
}
