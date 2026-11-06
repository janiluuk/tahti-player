import { openAsBlob } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { apiPost, CliError } from './api-client.mjs';

/** Extensions the uploader accepts, with the content type sent to the API
 * (which only accepts `audio/*`). */
export const AUDIO_TYPES = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
};

/** The API's own limit on one upload (PrepareUploadSchema in @tahti/shared). */
export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 200;

/** "01_night-drive.flac" -> "01 night-drive": the file name without its
 * extension, underscores as spaces, trimmed to the API's title limit. */
export function titleFromFilename(file) {
  const name = basename(file, extname(file)).replace(/_+/g, ' ').trim();
  return (name || basename(file)).slice(0, MAX_TITLE_LENGTH);
}

export function audioContentType(path) {
  return AUDIO_TYPES[extname(path).toLowerCase()] ?? null;
}

/** Why a file cannot be uploaded (wrong type, empty, over 2 GB), or null. */
export function uploadRejection(path, sizeBytes) {
  if (!audioContentType(path)) {
    return `not an audio file (${Object.keys(AUDIO_TYPES).join(', ')})`;
  }
  if (sizeBytes === 0) {
    return 'empty file';
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    return 'larger than 2 GB';
  }
  return null;
}

/**
 * Uploads one audio file as a new library sound the way tahti-web does:
 * `POST /api/uploads/prepare` for a presigned storage URL, a `PUT` of the
 * file, then `POST /api/uploads/complete` with the storage ETag. Answers the
 * new sound id.
 */
export async function uploadSoundFile(
  config,
  path,
  { title, metadata = {}, sizeBytes } = {},
) {
  const size = sizeBytes ?? (await stat(path)).size;
  const rejection = uploadRejection(path, size);
  if (rejection) {
    throw new CliError(`Cannot upload ${basename(path)}: ${rejection}`);
  }
  const contentType = audioContentType(path);
  const soundTitle = (title ?? titleFromFilename(path)).slice(
    0,
    MAX_TITLE_LENGTH,
  );
  const prepared = await apiPost(
    '/api/uploads/prepare',
    {
      filename: basename(path),
      contentType,
      fileSizeBytes: size,
      title: soundTitle,
    },
    config,
  );
  let put;
  try {
    put = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: await openAsBlob(path, { type: contentType }),
    });
  } catch (error) {
    throw new CliError(`Upload failed: ${error?.message ?? error}`);
  }
  if (!put.ok) {
    throw new CliError(`Upload failed (HTTP ${put.status})`);
  }
  const etag = (put.headers.get('etag') ?? '').replace(/"/g, '');
  if (!etag) {
    throw new CliError('Upload failed: storage returned no ETag');
  }
  const done = await apiPost(
    '/api/uploads/complete',
    {
      uploadId: prepared.uploadId,
      etag,
      title: soundTitle,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    },
    config,
  );
  return done.itemId ?? null;
}
