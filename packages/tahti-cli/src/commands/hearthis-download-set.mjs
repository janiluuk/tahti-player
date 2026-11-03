import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { CliError, requireToken } from '../api-client.mjs';
import { formatTable } from '../format.mjs';
import {
  DOWNLOAD_LAYOUTS,
  extensionFromContentType,
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
    sync = false,
    artwork = true,
    flac = false,
    yearOverride = null,
    exclude = null,
    tracks = null,
    coverName = 'cover',
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
  const year = yearOverride ?? resolveAlbumYear(catalog.set, catalog.tracks);
  const root = resolve(outDir);
  const owner = resolveSetOwner(catalog.set, catalog.tracks);
  const pathFor = (track, extension, position) =>
    layoutRelativePath(layout, {
      extension: flac && FLAC_SOURCES.has(extension) ? 'flac' : extension,
      artist,
      setTitle: albumTitle,
      albumTitle,
      year,
      position,
      trackTitle: track.title,
    });

  const excludePattern = exclude ? compilePattern(exclude, '--exclude') : null;
  const trackFilter = tracks ? parseTrackSelection(tracks) : null;
  const rows = [];
  const keep = new Set();
  const keepStems = new Set();
  const folders = new Set();
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
    const stemPath = join(
      root,
      pathFor(track, 'x', position).replace(/\.x$/, ''),
    );
    folders.add(dirname(stemPath));
    if (
      excludePattern?.test(track.title) ||
      (trackFilter && !trackFilter.has(position))
    ) {
      keepStems.add(stemPath);
      rows.push({
        position,
        title: track.title,
        status: 'skipped',
        reason: 'not selected',
        path: null,
      });
      onProgress?.({ position, title: track.title, status: 'skipped' });
      continue;
    }
    if (!track.downloadable || !track.downloadUrl) {
      keepStems.add(stemPath);
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
    if (!force && (await fileSize(absolute)) === null) {
      const sibling = await sameStemFile(absolute);
      if (sibling) {
        const remoteSize = await remoteFileSize(track.downloadUrl);
        if (remoteSize !== null && remoteSize === (await fileSize(sibling))) {
          absolute = sibling;
          relativePath = relative(root, sibling);
        }
      }
    }
    keep.add(absolute);

    const localSize = await fileSize(absolute);
    let changed = false;
    const converted = flac && FLAC_SOURCES.has(extension);
    if (sync && !force && localSize !== null && !converted) {
      const remoteSize = await remoteFileSize(track.downloadUrl);
      changed = remoteSize !== null && remoteSize !== localSize;
    }

    if (!force && !changed && localSize !== null) {
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
        status: changed ? 'would-update' : 'would-download',
        reason: changed ? 'size differs' : null,
        path: relativePath,
      });
      onProgress?.({
        position: track.position,
        title: track.title,
        status: changed ? 'would-update' : 'would-download',
      });
      continue;
    }

    try {
      const saved = await downloadTrackFile(
        track,
        root,
        (ext) => pathFor(track, ext, position),
        { flac },
      );
      relativePath = saved.relativePath;
      absolute = saved.absolutePath;
      keep.add(absolute);
      rows.push({
        position: track.position,
        title: track.title,
        status: changed ? 'updated' : 'downloaded',
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

  const coverUrl = largestCover(
    catalog.set?.coverUrl ??
      catalog.tracks.find((track) => track.userPermalink === owner)?.coverUrl ??
      null,
  );
  const artworkResults = [];
  if (artwork && coverUrl) {
    for (const folder of folders) {
      artworkResults.push(
        await saveArtwork(coverUrl, folder, { dryRun, force, sync, coverName }),
      );
    }
  }

  if (sync && folders.size > 0) {
    for (const folder of folders) {
      for (const name of await listFiles(folder)) {
        const path = join(folder, name);
        const ext = extname(name).slice(1).toLowerCase();
        const stem = path.slice(0, path.length - extname(name).length);
        const partial = name.endsWith('.partial');
        const plannedSibling = [...keep].find((kept) =>
          kept.startsWith(`${stem}.`),
        );
        const kept =
          keep.has(path) ||
          keepStems.has(stem) ||
          !SYNCED_EXTS.has(ext) ||
          (plannedSibling !== undefined &&
            (await fileSize(plannedSibling)) === null);
        if (!partial && kept) {
          continue;
        }
        if (!dryRun) {
          await unlink(path).catch(() => {});
        }
        rows.push({
          position: '-',
          title: name,
          status: dryRun ? 'would-delete' : 'deleted',
          reason: 'no longer in the Set',
          path: relative(root, path),
        });
      }
    }
  }

  if (!dryRun) {
    for (const folder of folders) {
      if ((await listFiles(folder)).length === 0) {
        continue;
      }
      const manifest = {
        permalink: catalog.permalink,
        title: albumTitle,
        layout,
        ownOnly,
        flac,
        coverName,
        out: relative(folder, root) || '.',
        syncedAt: new Date().toISOString(),
      };
      await writeFile(
        join(folder, MANIFEST_NAME),
        `${JSON.stringify(manifest, null, 2)}\n`,
      ).catch(() => {});
    }
  }

  return {
    permalink: catalog.permalink,
    url: catalog.url,
    artwork: artworkResults,
    artist,
    albumTitle,
    year,
    outDir: root,
    rows,
  };
}

async function downloadTrackFile(track, root, relativePathFor, { flac }) {
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
  const extension =
    extensionFromContentType(contentType) ??
    pickAudioExtension(track.downloadFilename, contentType);
  const relativePath = relativePathFor(extension);
  const absolutePath = join(root, relativePath);
  const convert = flac && FLAC_SOURCES.has(extension);

  await mkdir(dirname(absolutePath), { recursive: true });
  const partial = `${absolutePath}.partial`;
  const source = convert ? `${absolutePath}.${extension}.partial` : partial;
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(source));
    if (convert) {
      await encodeFlac(source, partial);
      await unlink(source);
    }
    await rename(partial, absolutePath);
  } catch (error) {
    await unlink(partial).catch(() => {});
    await unlink(source).catch(() => {});
    throw new CliError(`Download failed: ${error?.message ?? error}`);
  }

  return {
    relativePath: relative(root, absolutePath),
    absolutePath,
    extension,
  };
}

const FLAC_SOURCES = new Set(['wav', 'aif', 'aiff']);

export function encodeFlac(input, output) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'ffmpeg',
      [
        '-v',
        'error',
        '-y',
        '-f',
        extname(input.replace(/\.partial$/, '')).slice(1) === 'wav'
          ? 'wav'
          : 'aiff',
        '-i',
        input,
        '-map_metadata',
        '0',
        '-c:a',
        'flac',
        '-compression_level',
        '8',
        '-f',
        'flac',
        output,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) =>
      reject(
        new CliError(
          error.code === 'ENOENT'
            ? '--flac needs ffmpeg on PATH'
            : `ffmpeg failed: ${error.message}`,
        ),
      ),
    );
    child.on('close', (code) =>
      code === 0
        ? resolvePromise()
        : reject(new CliError(`ffmpeg failed: ${stderr.trim().slice(-300)}`)),
    );
  });
}

const SYNCED_EXTS = new Set([
  'mp3',
  'flac',
  'wav',
  'aif',
  'aiff',
  'm4a',
  'aac',
  'ogg',
  'opus',
  'bin',
]);

async function fileSize(path) {
  try {
    const info = await stat(path);
    return info.isFile() ? info.size : null;
  } catch {
    return null;
  }
}

export const MANIFEST_NAME = '.hearthis-set.json';

export async function findSetManifests(dir, depth = 4) {
  const found = [];
  const walk = async (folder, level) => {
    let entries;
    try {
      entries = await readdir(folder, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(folder, entry.name);
      if (entry.isFile() && entry.name === MANIFEST_NAME) {
        try {
          const manifest = JSON.parse(await readFile(path, 'utf8'));
          if (manifest?.permalink) {
            found.push({ folder, manifest });
          }
        } catch {
          continue;
        }
      } else if (
        entry.isDirectory() &&
        level < depth &&
        !entry.name.startsWith('.')
      ) {
        await walk(path, level + 1);
      }
    }
  };
  await walk(resolve(dir), 0);
  return found;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePattern(pattern, flag) {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    throw new CliError(`${flag} is not a valid pattern: ${pattern}`);
  }
}

export function parseTrackSelection(value) {
  const selected = new Set();
  for (const part of String(value).split(',')) {
    const match = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part);
    if (!match) {
      throw new CliError(
        `--tracks takes numbers and ranges, e.g. 1,3-5 (got "${part}")`,
      );
    }
    const from = Number(match[1]);
    const to = Number(match[2] ?? match[1]);
    for (let n = Math.min(from, to); n <= Math.max(from, to); n += 1) {
      selected.add(n);
    }
  }
  return selected;
}

async function sameStemFile(path) {
  const stem = path.slice(0, path.length - extname(path).length);
  const name = stem.slice(dirname(stem).length + 1);
  const match = (await listFiles(dirname(path))).find(
    (file) =>
      file.slice(0, file.length - extname(file).length) === name &&
      SYNCED_EXTS.has(extname(file).slice(1).toLowerCase()),
  );
  return match ? join(dirname(path), match) : null;
}

async function listFiles(folder) {
  try {
    const entries = await readdir(folder, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

export async function remoteFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const length = Number(response.headers.get('content-length'));
    return response.ok && Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

export function largestCover(url) {
  return url ? url.replace(/w500_h500/, 'w1000_h1000') : null;
}

async function saveArtwork(url, folder, { dryRun, force, sync, coverName }) {
  const existing = (await listFiles(folder)).find((name) =>
    new RegExp(`^${escapeRegExp(coverName)}\\.(jpe?g|png|webp)$`, 'i').test(
      name,
    ),
  );
  const existingPath = existing ? join(folder, existing) : null;
  if (existingPath && !force) {
    if (!sync) {
      return { status: 'skipped', path: existingPath };
    }
    const remoteSize = await remoteFileSize(url);
    if (remoteSize === null || remoteSize === (await fileSize(existingPath))) {
      return { status: 'skipped', path: existingPath };
    }
  }
  if (dryRun) {
    return {
      status: existingPath ? 'would-update' : 'would-download',
      path: existingPath ?? join(folder, `${coverName}.jpg`),
    };
  }
  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }
    const type = response.headers.get('content-type') ?? '';
    const ext = type.includes('png')
      ? 'png'
      : type.includes('webp')
        ? 'webp'
        : 'jpg';
    const path = join(folder, `${coverName}.${ext}`);
    await mkdir(folder, { recursive: true });
    await pipeline(
      Readable.fromWeb(response.body),
      createWriteStream(`${path}.partial`),
    );
    await rename(`${path}.partial`, path);
    if (existingPath && existingPath !== path) {
      await unlink(existingPath).catch(() => {});
    }
    return { status: existingPath ? 'updated' : 'downloaded', path };
  } catch (error) {
    return { status: 'failed', path: folder, reason: error?.message ?? error };
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
    sync = false,
    artwork = true,
    flac = false,
    yearOverride = null,
    exclude = null,
    tracks = null,
    coverName = 'cover',
    log = (line) => process.stderr.write(`${line}\n`),
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
    sync,
    artwork,
    flac,
    yearOverride,
    exclude,
    tracks,
    coverName,
    onProgress: json
      ? undefined
      : (row) =>
          log(
            `  ${String(row.position).padStart(2, '0')} ${row.title}: ${row.status}`,
          ),
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
  const count = (status) =>
    result.rows.filter((row) => row.status === status).length;
  const syncSummary = sync
    ? dryRun
      ? ` ${count('would-update')} would update, ${count('would-delete')} would delete.`
      : ` ${count('updated')} updated, ${count('deleted')} deleted.`
    : '';
  const artworkSummary = result.artwork.length
    ? `\nArtwork: ${result.artwork.map((art) => `${art.status} ${art.path}`).join(', ')}`
    : '';
  const yearLabel = result.year != null ? ` (${result.year})` : '';
  const header = `${result.artist} / ${result.albumTitle}${yearLabel} → ${result.outDir}`;
  const summary = dryRun
    ? `${would} would download, ${skipped} skipped, ${failed} failed.`
    : `${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`;
  const fullSummary = `${summary}${syncSummary}${artworkSummary}`;
  const note =
    'Uses hearthis.at download_url (original upload, often WAV/FLAC); stream previews are never used.';

  return {
    output: `${header}\n\n${formatDownloadRows(result.rows)}\n\n${fullSummary}\n${note}`,
    exitCode:
      failed > 0 || result.artwork.some((art) => art.status === 'failed')
        ? 1
        : 0,
  };
}
