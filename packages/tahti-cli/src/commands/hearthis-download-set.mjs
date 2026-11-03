import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { CliError, requireToken } from '../api-client.mjs';
import { formatTable } from '../format.mjs';
import {
  DOWNLOAD_LAYOUTS,
  layoutRelativePath,
  pickAudioExtension,
  resolveAlbumArtist,
  resolveAlbumTitle,
  resolveAlbumYear,
  resolveSetOwner,
} from './hearthis-paths.mjs';
import { fetchHearthisSetTracks } from './hearthis-set.mjs';

/**
 * Prefer hearthis.at's download_url (original upload — often WAV/FLAC) over
 * stream_url (compressed preview). Only downloadable tracks are written.
 */
export async function downloadHearthisSet(
  config,
  permalinkOrUrl,
  {
    outDir = '.',
    dryRun = false,
    force = false,
    layout = 'discography',
    ownOnly = false,
    title = null,
    onProgress,
  } = {},
) {
  requireToken(config);
  if (!DOWNLOAD_LAYOUTS.includes(layout)) {
    throw new CliError(
      `Unknown layout: ${layout} (use ${DOWNLOAD_LAYOUTS.join(', ')})`,
    );
  }
  const catalog = await fetchHearthisSetTracks(config, permalinkOrUrl);
  const artist = resolveAlbumArtist(catalog.set, catalog.tracks);
  const albumTitle = resolveAlbumTitle(catalog.set, catalog.permalink, title);
  const year = resolveAlbumYear(catalog.set, catalog.tracks);
  const root = resolve(outDir);
  const owner = resolveSetOwner(catalog.set, catalog.tracks);
  const pathFor = (track, extension, position) =>
    layoutRelativePath(layout, {
      artist,
      setTitle: albumTitle,
      albumTitle,
      year,
      position,
      trackTitle: track.title,
      extension,
    });

  const rows = [];
  let nextPosition = 0;
  for (const track of catalog.tracks) {
    if (ownOnly && owner && track.userPermalink !== owner) {
      rows.push({
        position: track.position,
        title: track.title,
        status: 'skipped',
        reason: `uploaded by @${track.userPermalink}`,
        path: null,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'skipped',
      });
      continue;
    }
    nextPosition += 1;
    const position = ownOnly ? nextPosition : track.position;
    if (!track.downloadable || !track.downloadUrl) {
      rows.push({
        position: track.position,
        title: track.title,
        status: 'skipped',
        reason: 'not downloadable',
        path: null,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'skipped',
      });
      continue;
    }

    // First-pass path from filename hint; may adjust after Content-Type.
    const extension = pickAudioExtension(track.downloadFilename, null);
    let relativePath = pathFor(track, extension, position);
    let absolute = join(root, relativePath);

    if (!force && (await pathExists(absolute))) {
      rows.push({
        position: track.position,
        title: track.title,
        status: 'skipped',
        reason: 'already exists',
        path: relativePath,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'skipped',
      });
      continue;
    }

    if (dryRun) {
      rows.push({
        position: track.position,
        title: track.title,
        status: 'would-download',
        reason: null,
        path: relativePath,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'would-download',
      });
      continue;
    }

    try {
      const saved = await downloadTrackFile(track, root, (ext) =>
        pathFor(track, ext, position),
      );
      relativePath = saved.relativePath;
      absolute = saved.absolutePath;
      rows.push({
        position: track.position,
        title: track.title,
        status: 'downloaded',
        reason: null,
        path: relativePath,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'downloaded',
      });
    } catch (error) {
      rows.push({
        position: track.position,
        title: track.title,
        status: 'failed',
        reason: error?.message ?? String(error),
        path: relativePath,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: 'failed',
      });
    }
  }

  return {
    permalink: catalog.permalink,
    url: catalog.url,
    artist,
    albumTitle,
    year,
    outDir: root,
    rows,
  };
}

async function downloadTrackFile(track, root, relativePathFor) {
  let response;
  try {
    response = await fetch(track.downloadUrl);
  } catch (error) {
    throw new CliError(`Download failed: ${error?.message ?? error}`);
  }
  if (!response.ok || !response.body) {
    throw new CliError(`Download failed (HTTP ${response.status})`);
  }

  const contentType = response.headers.get('content-type');
  const extension = pickAudioExtension(track.downloadFilename, contentType);
  const relativePath = relativePathFor(extension);
  const absolutePath = join(root, relativePath);

  await mkdir(dirname(absolutePath), { recursive: true });
  const partial = `${absolutePath}.partial`;
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    await rename(partial, absolutePath);
  } catch (error) {
    await unlink(partial).catch(() => {});
    throw new CliError(`Download failed: ${error?.message ?? error}`);
  }

  return {
    relativePath: relative(root, absolutePath),
    absolutePath,
    extension,
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function formatDownloadRows(rows) {
  return formatTable(
    ['#', 'TITLE', 'STATUS', 'PATH / REASON'],
    rows.map((row) => [
      String(row.position).padStart(2, '0'),
      row.title,
      row.status,
      row.path || row.reason || '-',
    ]),
  );
}

export async function runHearthisDownloadSet(
  config,
  permalinkOrUrl,
  {
    json = false,
    outDir = '.',
    dryRun = false,
    force = false,
    layout = 'discography',
    ownOnly = false,
    title = null,
  } = {},
) {
  if (!permalinkOrUrl) {
    throw new CliError(
      'Missing set permalink.\nRun `tahti hearthis download-set --help` for usage.',
    );
  }

  const result = await downloadHearthisSet(config, permalinkOrUrl, {
    outDir,
    dryRun,
    force,
    layout,
    ownOnly,
    title,
  });

  if (json) {
    return {
      output: JSON.stringify(result, null, 2),
      exitCode: result.rows.some((row) => row.status === 'failed') ? 1 : 0,
    };
  }

  const downloaded = result.rows.filter(
    (row) => row.status === 'downloaded',
  ).length;
  const would = result.rows.filter(
    (row) => row.status === 'would-download',
  ).length;
  const skipped = result.rows.filter((row) => row.status === 'skipped').length;
  const failed = result.rows.filter((row) => row.status === 'failed').length;
  const yearLabel = result.year != null ? ` (${result.year})` : '';
  const header = `${result.artist} / ${result.albumTitle}${yearLabel} → ${result.outDir}`;
  const summary = dryRun
    ? `${would} would download, ${skipped} skipped, ${failed} failed.`
    : `${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`;
  const note =
    'Uses hearthis.at download_url (original upload, often WAV/FLAC); stream previews are never used.';

  return {
    output: `${header}\n\n${formatDownloadRows(result.rows)}\n\n${summary}\n${note}`,
    exitCode: failed > 0 ? 1 : 0,
  };
}
