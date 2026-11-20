import { apiGet, apiPost, CliError, requireToken } from '../api-client.mjs';
import { formatTable } from '../format.mjs';
import { largestCover } from './hearthis-download-set.mjs';
import { fetchLibrary, findLibraryMatch } from './hearthis-sounds.mjs';
import { HEARTHIS_API } from './hearthis-user-sets.mjs';

const TRACK_PAGE = 50;
const MAX_TRACK_PAGES = 40;

export async function fetchHearthisProfile(handle, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(
    `${HEARTHIS_API}/${encodeURIComponent(handle)}/`,
  );
  if (!response.ok) {
    throw new CliError(
      `hearthis.at answered HTTP ${response.status} for @${handle}`,
    );
  }
  return response.json();
}

export async function fetchAllHearthisUserTracks(
  handle,
  { fetchImpl = fetch } = {},
) {
  const tracks = [];
  for (let page = 1; page <= MAX_TRACK_PAGES; page += 1) {
    const response = await fetchImpl(
      `${HEARTHIS_API}/${encodeURIComponent(handle)}/?type=tracks&page=${page}&count=${TRACK_PAGE}`,
    );
    if (!response.ok) {
      throw new CliError(
        `hearthis.at answered HTTP ${response.status} listing tracks for @${handle}`,
      );
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }
    for (const row of rows) {
      tracks.push({
        id: String(row.id),
        title: String(row.title ?? '')
          .replace(/\s+/g, ' ')
          .trim(),
        url: String(row.permalink_url ?? row.uri ?? ''),
        durationSec: Number.parseInt(String(row.duration ?? '0'), 10) || 0,
        coverUrl: largestCover(
          row.artwork_url_retina || row.artwork_url || row.thumb_hires || null,
        ),
      });
    }
    if (rows.length < TRACK_PAGE) {
      break;
    }
  }
  return tracks;
}

export async function setSoundCoverFromUrl(config, soundId, sourceUrl) {
  return apiPost(
    `/api/me/sound/${encodeURIComponent(soundId)}/banner/from-url`,
    { sourceUrl },
    config,
  );
}

/** Sets each row's sound banner from the matching track's hearthis cover. */
export async function applyTrackCovers(
  config,
  rows,
  tracks,
  { log = () => {} } = {},
) {
  const results = [];
  for (const row of rows) {
    if (!row.soundId) {
      continue;
    }
    const track = tracks.find((entry) => entry.id === row.id);
    const coverUrl = largestCover(track?.coverUrl ?? null);
    if (!coverUrl) {
      results.push({
        soundId: row.soundId,
        title: row.title,
        status: 'skipped',
      });
      continue;
    }
    try {
      await setSoundCoverFromUrl(config, row.soundId, coverUrl);
      results.push({
        soundId: row.soundId,
        title: row.title,
        status: 'set',
        url: coverUrl,
      });
      log(
        `Cover ${String(row.position ?? '').padStart(2, '0')} ${row.title}`.trim(),
      );
    } catch (error) {
      results.push({
        soundId: row.soundId,
        title: row.title,
        status: 'failed',
        reason: error?.message ?? String(error),
      });
    }
  }
  return results;
}

/** Rehosts a remote image as the profile backdrop via prepare → PUT → complete. */
export async function setBackdropFromUrl(
  config,
  sourceUrl,
  { fetchImpl = fetch } = {},
) {
  const image = await fetchImpl(sourceUrl);
  if (!image.ok) {
    throw new CliError(
      `Could not download backdrop (${image.status}): ${sourceUrl}`,
    );
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  const contentType = image.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';
  const prepared = await apiPost(
    '/api/me/profile/backdrop/prepare',
    {
      filename: `hearthis-backdrop.${ext}`,
      contentType,
    },
    config,
  );
  const put = await fetchImpl(prepared.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: bytes,
  });
  if (!put.ok) {
    throw new CliError(
      `Could not upload backdrop to storage (HTTP ${put.status})`,
    );
  }
  return apiPost(
    '/api/me/profile/backdrop/complete',
    { uploadKey: prepared.uploadKey },
    config,
  );
}

export async function setAvatarFromUrl(config, sourceUrl) {
  return apiPost('/api/me/profile/avatar/from-url', { sourceUrl }, config);
}

function soundForTrack(track, sounds) {
  const match = findLibraryMatch(track, sounds);
  return match?.sound ?? null;
}

/**
 * Pull cover art for every library sound that matches a hearthis.at track,
 * and optionally the profile backdrop (and avatar) from the hearthis profile.
 * Cover import is on by default; pass coverArt: false / backdrop: false to skip.
 */
export async function runHearthisSyncArtwork(
  config,
  {
    dryRun = false,
    json = false,
    coverArt = true,
    backdrop = true,
    avatar = false,
    handle = null,
    fetchImpl = fetch,
  } = {},
) {
  requireToken(config);
  let hearthisHandle = handle;
  if (!hearthisHandle) {
    const profile = await apiGet('/api/me/profile', config);
    hearthisHandle =
      profile.hearthisUsername || profile.socialLinks?.hearthisAt || null;
  }
  if (!hearthisHandle) {
    throw new CliError(
      'No hearthis.at handle on this account. Set one in Settings → Profile, or pass --user <handle>.',
    );
  }

  const hearthisProfile = await fetchHearthisProfile(hearthisHandle, {
    fetchImpl,
  });
  const result = {
    handle: hearthisHandle,
    coverArt: coverArt ? [] : null,
    backdrop: null,
    avatar: null,
  };

  if (backdrop) {
    const backgroundUrl = largestCover(hearthisProfile.background_url || null);
    if (!backgroundUrl) {
      result.backdrop = {
        status: 'skipped',
        reason: 'no background on hearthis.at',
      };
    } else if (dryRun) {
      result.backdrop = { status: 'would set', url: backgroundUrl };
    } else {
      try {
        const set = await setBackdropFromUrl(config, backgroundUrl, {
          fetchImpl,
        });
        result.backdrop = {
          status: 'set',
          url: set.backdropUrl ?? backgroundUrl,
        };
      } catch (error) {
        result.backdrop = {
          status: 'failed',
          url: backgroundUrl,
          reason: error?.message ?? String(error),
        };
      }
    }
  }

  if (avatar) {
    const avatarUrl = largestCover(
      hearthisProfile.avatar_url_retina || hearthisProfile.avatar_url || null,
    );
    if (!avatarUrl) {
      result.avatar = { status: 'skipped', reason: 'no avatar on hearthis.at' };
    } else if (dryRun) {
      result.avatar = { status: 'would set', url: avatarUrl };
    } else {
      try {
        const set = await setAvatarFromUrl(config, avatarUrl);
        result.avatar = { status: 'set', url: set.avatarUrl ?? avatarUrl };
      } catch (error) {
        result.avatar = {
          status: 'failed',
          url: avatarUrl,
          reason: error?.message ?? String(error),
        };
      }
    }
  }

  if (coverArt) {
    const tracks = await fetchAllHearthisUserTracks(hearthisHandle, {
      fetchImpl,
    });
    const library = await fetchLibrary(config);
    if (!library.complete) {
      throw new CliError(
        'Your library has more sounds than the CLI can read in one go.',
      );
    }
    for (const track of tracks) {
      const sound = soundForTrack(track, library.sounds);
      if (!sound) {
        result.coverArt.push({
          trackId: track.id,
          title: track.title,
          status: 'no library match',
        });
        continue;
      }
      if (!track.coverUrl) {
        result.coverArt.push({
          trackId: track.id,
          title: track.title,
          soundId: sound.id,
          status: 'no cover on hearthis.at',
        });
        continue;
      }
      if (dryRun) {
        result.coverArt.push({
          trackId: track.id,
          title: track.title,
          soundId: sound.id,
          status: 'would set',
          url: track.coverUrl,
        });
        continue;
      }
      try {
        await setSoundCoverFromUrl(config, sound.id, track.coverUrl);
        result.coverArt.push({
          trackId: track.id,
          title: track.title,
          soundId: sound.id,
          status: 'set',
          url: track.coverUrl,
        });
      } catch (error) {
        result.coverArt.push({
          trackId: track.id,
          title: track.title,
          soundId: sound.id,
          status: 'failed',
          reason: error?.message ?? String(error),
        });
      }
    }
  }

  if (json) {
    return {
      output: JSON.stringify(result, null, 2),
      exitCode: exitCodeFor(result),
    };
  }

  const lines = [`hearthis.at/@${hearthisHandle}`];
  if (result.backdrop) {
    lines.push(
      `Backdrop: ${result.backdrop.status}${result.backdrop.reason ? ` (${result.backdrop.reason})` : ''}`,
    );
  }
  if (result.avatar) {
    lines.push(
      `Avatar: ${result.avatar.status}${result.avatar.reason ? ` (${result.avatar.reason})` : ''}`,
    );
  }
  if (result.coverArt) {
    lines.push(
      formatTable(
        ['TRACK', 'SOUND', 'STATUS'],
        result.coverArt.map((row) => [
          row.title,
          row.soundId ?? '—',
          row.status + (row.reason ? ` (${row.reason})` : ''),
        ]),
      ),
    );
    const counts = result.coverArt.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
    lines.push(
      `Covers: ${Object.entries(counts)
        .map(([status, count]) => `${count} ${status}`)
        .join(', ')}.`,
    );
  }
  if (dryRun) {
    lines.push('Dry run — nothing was changed.');
  }
  return { output: lines.join('\n'), exitCode: exitCodeFor(result) };
}

function exitCodeFor(result) {
  if (
    result.backdrop?.status === 'failed' ||
    result.avatar?.status === 'failed'
  ) {
    return 1;
  }
  if (result.coverArt?.some((row) => row.status === 'failed')) {
    return 1;
  }
  return 0;
}
