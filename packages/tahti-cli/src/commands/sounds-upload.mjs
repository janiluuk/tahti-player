import { stat } from 'node:fs/promises';
import { basename } from 'node:path';

import { CliError, requireToken } from '../api-client.mjs';
import { readAudioTags } from '../audio-tags.mjs';
import { formatTable } from '../format.mjs';
import {
  titleFromFilename,
  uploadRejection,
  uploadSoundFile,
} from '../sound-upload.mjs';

/** Splits `--tag` values (repeatable, comma-separated) into the trimmed,
 * de-duplicated list the API takes (at most 20, 40 characters each). */
export function parseTags(values = []) {
  const tags = [];
  for (const value of values) {
    for (const part of String(value).split(',')) {
      const tag = part.trim().slice(0, 40);
      if (tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        tags.push(tag);
      }
    }
  }
  return tags.slice(0, 20);
}

export async function uploadSounds(
  config,
  files,
  {
    title = null,
    genre = null,
    description = null,
    tags = [],
    ignoreTags = false,
    onProgress,
  } = {},
) {
  if (files.length === 0) {
    throw new CliError(
      'Missing file.\nRun `tahti sounds upload --help` for usage.',
    );
  }
  if (title && files.length > 1) {
    throw new CliError('--title names one sound; pass a single file with it.');
  }
  requireToken(config);
  const results = [];
  for (const path of files) {
    const fileTags = ignoreTags ? {} : await readAudioTags(path);
    const result = {
      file: path,
      title: title ?? fileTags.title ?? titleFromFilename(path),
      status: 'uploaded',
      id: null,
      error: null,
    };
    let size = null;
    try {
      size = (await stat(path)).size;
    } catch {
      result.status = 'failed';
      result.error = 'file not found';
    }
    const rejection = size === null ? null : uploadRejection(path, size);
    if (rejection) {
      result.status = 'failed';
      result.error = rejection;
    }
    if (result.status === 'uploaded') {
      const metadata = {
        ...(fileTags.artist ? { artistName: fileTags.artist } : {}),
        ...(genre || fileTags.genre ? { genre: genre ?? fileTags.genre } : {}),
        ...(fileTags.bpm ? { bpm: fileTags.bpm } : {}),
        ...(description ? { description } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      };
      try {
        result.id = await uploadSoundFile(config, path, {
          title: result.title,
          metadata,
          sizeBytes: size,
        });
      } catch (error) {
        result.status = 'failed';
        result.error = error?.message ?? String(error);
      }
    }
    results.push(result);
    onProgress?.(result);
  }
  return results;
}

export async function runSoundsUpload(config, files, options = {}) {
  const results = await uploadSounds(config, files, {
    title: options.title || null,
    genre: options.genre || null,
    description: options.description || null,
    tags: parseTags(options.tag ?? []),
    ignoreTags: Boolean(options['ignore-tags']),
  });
  const exitCode = results.some((result) => result.status === 'failed') ? 1 : 0;
  if (options.json) {
    return { output: JSON.stringify(results, null, 2), exitCode };
  }
  const table = formatTable(
    ['FILE', 'TITLE', 'STATUS', 'ID / REASON'],
    results.map((result) => [
      basename(result.file),
      result.title,
      result.status,
      result.id ?? result.error ?? '-',
    ]),
  );
  return {
    output: `${table}\n\nSounds start as PENDING while the API processes them; check with \`tahti library processing\`.`,
    exitCode,
  };
}
