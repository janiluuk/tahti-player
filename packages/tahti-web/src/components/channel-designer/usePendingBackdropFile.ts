import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import { MAX_HEADER_VIDEO_BYTES } from '../../api/channel-design';
import { HEADER_MEDIA_TYPES } from './slideshowOptions';

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
      toast.error(i18n.t('web:toasts.backdropFileTooLarge'));
      return;
    }
    if (!HEADER_MEDIA_TYPES.includes(file.type)) {
      toast.error(i18n.t('web:toasts.backdropFileType'));
      return;
    }
    if (pendingVideoPreviewUrl) {
      URL.revokeObjectURL(pendingVideoPreviewUrl);
    }
    setPendingVideoFile(file);
    setPendingVideoPreviewUrl(URL.createObjectURL(file));
    markDirty();
  };

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
