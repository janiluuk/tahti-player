import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { apiGet, CliError } from '../api-client.mjs';
import { sanitizePathSegment } from './hearthis-paths.mjs';

export async function fetchSoundDownload(config, id) {
  if (!id) {
    throw new CliError(
      'Missing sound id.\nRun `tahti library download --help` for usage.',
    );
  }
  return apiGet(`/api/me/sound/${encodeURIComponent(id)}/download`, config);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runLibraryDownload(
  config,
  id,
  { outDir = '.', force = false, url = false, json = false } = {},
) {
  const download = await fetchSoundDownload(config, id);
  if (json) {
    return JSON.stringify(download, null, 2);
  }
  if (url) {
    return download.url;
  }
  const filename = sanitizePathSegment(download.filename, `${id}.audio`);
  const root = resolve(outDir);
  const target = join(root, filename);
  if (!force && (await exists(target))) {
    throw new CliError(`${target} already exists. Add --force to replace it.`);
  }

  let response;
  try {
    response = await fetch(download.url);
  } catch (error) {
    throw new CliError(`Download failed: ${error?.message ?? error}`);
  }
  if (!response.ok || !response.body) {
    throw new CliError(`Download failed (HTTP ${response.status})`);
  }

  await mkdir(root, { recursive: true });
  const partial = `${target}.partial`;
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    await rename(partial, target);
  } catch (error) {
    await unlink(partial).catch(() => {});
    throw new CliError(`Download failed: ${error?.message ?? error}`);
  }
  return `Saved ${target}`;
}
