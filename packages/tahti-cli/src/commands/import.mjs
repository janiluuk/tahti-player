import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';

import { apiGet, CliError, requireToken } from '../api-client.mjs';
import { readAudioTags } from '../audio-tags.mjs';
import { formatTable } from '../format.mjs';
import {
  AUDIO_TYPES,
  MAX_FILE_BYTES,
  titleFromFilename,
  uploadSoundFile,
} from '../sound-upload.mjs';

export { AUDIO_TYPES, MAX_FILE_BYTES, titleFromFilename };

/** Audio files in `folder`, sorted by path. Hidden files and folders are
 * skipped; subfolders are only entered with `recursive`. */
export async function findAudioFiles(folder, { recursive = false } = {}) {
  const root = resolve(folder);
  let info;
  try {
    info = await stat(root);
  } catch {
    throw new CliError(`Folder not found: ${folder}`);
  }
  if (!info.isDirectory()) {
    throw new CliError(`Not a folder: ${folder}`);
  }
  const found = [];
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          await walk(path);
        }
      } else if (
        entry.isFile() &&
        AUDIO_TYPES[extname(entry.name).toLowerCase()]
      ) {
        found.push(path);
      }
    }
  };
  await walk(root);
  return found.sort((a, b) => a.localeCompare(b));
}

/**
 * Uploads every audio file in a folder as a new library sound, one at a
 * time. A file whose title is already in the library is skipped unless
 * `force` is set, so running the import again only sends what is new. One
 * failed file does not stop the rest.
 */
export async function importFolder(
  config,
  folder,
  {
    recursive = false,
    dryRun = false,
    force = false,
    ignoreTags = false,
    onProgress,
  } = {},
) {
  const root = resolve(folder);
  const files = await findAudioFiles(folder, { recursive });
  const existing = new Set();
  if (!force && files.length > 0) {
    const sounds = await apiGet('/api/me/sound', config);
    for (const sound of sounds) {
      existing.add(String(sound.title).trim().toLowerCase());
    }
  }

  const results = [];
  for (const path of files) {
    const file = relative(root, path) || basename(path);
    const tags = ignoreTags ? {} : await readAudioTags(path);
    const title = tags.title ?? titleFromFilename(path);
    const metadata = {
      ...(tags.artist ? { artistName: tags.artist } : {}),
      ...(tags.genre ? { genre: tags.genre } : {}),
      ...(tags.bpm ? { bpm: tags.bpm } : {}),
    };
    const result = {
      file,
      title,
      artist: tags.artist ?? null,
      status: 'uploaded',
      id: null,
      error: null,
    };
    const { size } = await stat(path);
    if (size === 0) {
      result.status = 'skipped';
      result.error = 'empty file';
    } else if (size > MAX_FILE_BYTES) {
      result.status = 'skipped';
      result.error = 'larger than 2 GB';
    } else if (existing.has(title.toLowerCase())) {
      result.status = 'skipped';
      result.error = 'already in your library';
    } else if (dryRun) {
      result.status = 'would upload';
    } else {
      try {
        result.id = await uploadSoundFile(config, path, {
          title,
          metadata,
          sizeBytes: size,
        });
        existing.add(title.toLowerCase());
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

export function formatImportTable(results) {
  return formatTable(
    ['FILE', 'TITLE', 'STATUS', 'ID / REASON'],
    results.map((result) => [
      result.file,
      result.title,
      result.status,
      result.id ?? result.error ?? '-',
    ]),
  );
}

export function summarizeImport(results) {
  const count = (status) =>
    results.filter((result) => result.status === status).length;
  const parts = [];
  if (count('uploaded')) {
    parts.push(`${count('uploaded')} uploaded`);
  }
  if (count('would upload')) {
    parts.push(`${count('would upload')} to upload`);
  }
  if (count('skipped')) {
    parts.push(`${count('skipped')} skipped`);
  }
  if (count('failed')) {
    parts.push(`${count('failed')} failed`);
  }
  return parts.join(', ');
}

export async function runImport(
  config,
  folder,
  {
    json = false,
    recursive = false,
    dryRun = false,
    force = false,
    ignoreTags = false,
  } = {},
) {
  // Checked up front so a dry run fails the same way a real one would.
  requireToken(config);
  const results = await importFolder(config, folder, {
    recursive,
    dryRun,
    force,
    ignoreTags,
  });
  const exitCode = results.some((result) => result.status === 'failed') ? 1 : 0;
  if (json) {
    return { output: JSON.stringify(results, null, 2), exitCode };
  }
  if (results.length === 0) {
    return `No audio files found in ${folder}${recursive ? '' : ' (use --recursive to include subfolders)'}.`;
  }
  return {
    output: `${formatImportTable(results)}\n\n${summarizeImport(results)}`,
    exitCode,
  };
}
