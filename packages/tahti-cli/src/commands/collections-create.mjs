import { apiPost, CliError } from '../api-client.mjs';
import { formatDetails } from '../format.mjs';

/** Mirror `COLLECTION_TYPES` and the `visibility` enum of
 * `CreateCollectionSchema` in `@tahti/shared`. */
export const COLLECTION_TYPES = ['MIX_SERIES', 'ALBUM', 'CUSTOM'];
export const COLLECTION_VISIBILITIES = ['PUBLIC', 'UNLISTED', 'DRAFT'];

export const MAX_COLLECTION_NAME = 100;
export const MAX_COLLECTION_DESCRIPTION = 1000;

function enumValue(flag, value, allowed) {
  if (value == null || value === '') {
    return null;
  }
  const normalized = String(value).trim().toUpperCase().replace(/-/g, '_');
  if (!allowed.includes(normalized)) {
    throw new CliError(
      `Invalid ${flag} "${value}". Expected one of: ${allowed
        .map((entry) => entry.toLowerCase().replace(/_/g, '-'))
        .join(', ')}.`,
    );
  }
  return normalized;
}

export function parseCollectionType(value) {
  return enumValue('--type', value, COLLECTION_TYPES);
}

/** `--private` is the DRAFT visibility: only the owner sees the collection. */
export function parseCollectionVisibility({ visibility, private: isPrivate }) {
  const parsed = enumValue('--visibility', visibility, COLLECTION_VISIBILITIES);
  if (isPrivate && parsed && parsed !== 'DRAFT') {
    throw new CliError(`--private and --visibility ${visibility} disagree.`);
  }
  return isPrivate ? 'DRAFT' : parsed;
}

export function collectionCreateBody({
  name,
  slug = null,
  type = null,
  description = null,
  visibility = null,
}) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new CliError(
      'Missing collection name.\nRun `tahti collections create --help` for usage.',
    );
  }
  if (trimmed.length > MAX_COLLECTION_NAME) {
    throw new CliError(
      `The name is ${trimmed.length} characters; collections allow ${MAX_COLLECTION_NAME}.`,
    );
  }
  const body = { name: trimmed };
  if (slug) {
    body.slug = slug;
  }
  if (type) {
    body.type = type;
  }
  if (description) {
    if (description.length > MAX_COLLECTION_DESCRIPTION) {
      throw new CliError(
        `The description is ${description.length} characters; collections allow ${MAX_COLLECTION_DESCRIPTION}.`,
      );
    }
    body.description = description;
  }
  if (visibility) {
    body.visibility = visibility;
  }
  return body;
}

/** Sets the cover by having the API fetch and rehost the image. A failure
 * is answered, not thrown: the collection exists either way. */
export async function setCollectionCoverFromUrl(config, slug, sourceUrl) {
  try {
    const result = await apiPost(
      `/api/me/collections/${encodeURIComponent(slug)}/cover/from-url`,
      { sourceUrl },
      config,
    );
    return { status: 'set', url: sourceUrl, coverUrl: result?.url ?? null };
  } catch (error) {
    if (!(error instanceof CliError)) {
      throw error;
    }
    return { status: 'failed', url: sourceUrl, reason: error.message };
  }
}

export async function createCollection(config, body, { coverUrl = null } = {}) {
  const collection = await apiPost('/api/me/collections', body, config);
  const cover = coverUrl
    ? await setCollectionCoverFromUrl(config, collection.slug, coverUrl)
    : null;
  return { collection, cover };
}

export async function runCollectionsCreate(
  config,
  name,
  {
    slug,
    type,
    description,
    visibility,
    private: isPrivate = false,
    coverUrl,
    json = false,
  } = {},
) {
  const body = collectionCreateBody({
    name,
    slug,
    type: parseCollectionType(type),
    description,
    visibility: parseCollectionVisibility({ visibility, private: isPrivate }),
  });
  const { collection, cover } = await createCollection(config, body, {
    coverUrl,
  });
  if (json) {
    return JSON.stringify({ ...collection, cover }, null, 2);
  }
  const details = formatDetails([
    ['Slug', collection.slug],
    ['Name', collection.name],
    ['Type', collection.type],
    [
      'Visibility',
      collection.visibility ?? (collection.isPublic ? 'PUBLIC' : 'DRAFT'),
    ],
    [
      'Cover',
      cover
        ? cover.status === 'set'
          ? 'set'
          : `not set (${cover.reason})`
        : null,
    ],
  ]);
  return {
    output: `Created collection "${collection.name}".\n${details}`,
    exitCode: cover?.status === 'failed' ? 1 : 0,
  };
}
