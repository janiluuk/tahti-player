import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

export const HEADER_STYLES = ['GRADIENT', 'SOLID', 'VIDEO_LOOP'] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

/** Direct video files and YouTube watch links supported by the VIDEO_LOOP
 * header. YouTube links are rendered as muted looped iframe embeds. */
export const HEADER_VIDEO_URL_PATTERN = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;

/** VIDEO_LOOP's `videoBackgroundUrl` column is deliberately generic (see the
 * backend schema comment: "YouTube/Vimeo or image URL for channel backdrop")
 * — a static image is a valid backdrop through the same field, not a
 * separate header style. */
export const HEADER_IMAGE_URL_PATTERN =
  /^https:\/\/\S+\.(jpe?g|png|webp|gif)(\?\S*)?$/i;

export function isHeaderImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return HEADER_IMAGE_URL_PATTERN.test(url.trim());
}

export function youtubeEmbedUrl(
  url: string | null | undefined,
  muted = true,
): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url.trim());
    let videoId = '';
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      videoId = parsed.searchParams.get('v') ?? '';
      if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] ?? videoId;
      }
    }
    return /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&rel=0`
      : null;
  } catch {
    return null;
  }
}

export function isValidHeaderVideoUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    HEADER_VIDEO_URL_PATTERN.test(url.trim()) || youtubeEmbedUrl(url) !== null
  );
}

/** Whether the VIDEO_LOOP header has *some* valid backdrop — a video source
 * or a static image, both stored in the same `videoBackgroundUrl` field. */
export function isValidHeaderBackdropUrl(
  url: string | null | undefined,
): boolean {
  return isValidHeaderVideoUrl(url) || isHeaderImageUrl(url);
}

export const MAX_HEADER_VIDEO_BYTES = 10 * 1024 * 1024;

export const HEADER_BACKDROP_UPLOAD_TYPES = [
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function uploadChannelHeaderVideo(
  file: File,
): Promise<
  { ok: true; videoBackgroundUrl: string } | { ok: false; error: string }
> {
  if (file.size > MAX_HEADER_VIDEO_BYTES) {
    return { ok: false, error: 'File must be 10 MB or smaller.' };
  }
  if (!HEADER_BACKDROP_UPLOAD_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: 'Use an MP4/WebM video or a JPEG/PNG/WebP/GIF image.',
    };
  }
  if (isForceMock()) {
    return { ok: true, videoBackgroundUrl: URL.createObjectURL(file) };
  }
  try {
    const { data: prepared } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/channel/video-background/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      }),
    });
    const upload = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!upload.ok) {
      throw new Error(`Video upload failed (${upload.status})`);
    }
    const { data } = await requestJson<{ videoBackgroundUrl: string }>(
      '/api/me/channel/video-background/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.uploadKey }),
      },
    );
    return { ok: true, videoBackgroundUrl: data.videoBackgroundUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Video upload failed',
    };
  }
}
