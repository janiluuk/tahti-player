import {
  apiPost,
  apiSendNoContent,
  CliError,
  parsePositiveInt,
} from '../api-client.mjs';
import { formatTable } from '../format.mjs';
import { fetchCollection } from './collections-show.mjs';

function itemsPath(slug) {
  return `/api/me/collections/${encodeURIComponent(slug)}/items`;
}

/** Adds one item at a time, so one bad id does not stop the rest. A 409
 * means the item is already there, which is the state the caller wanted. */
export async function runCollectionsAdd(
  config,
  slug,
  soundIds,
  { release, json = false } = {},
) {
  if (!slug) {
    throw new CliError(
      'Missing collection slug.\nRun `tahti collections add --help` for usage.',
    );
  }
  const targets = [
    ...soundIds.map((id) => ({ kind: 'track', id, body: { soundId: id } })),
    ...(release
      ? [{ kind: 'release', id: release, body: { releaseId: release } }]
      : []),
  ];
  if (targets.length === 0) {
    throw new CliError(
      'Give at least one sound id or --release <id>.\nRun `tahti collections add --help` for usage.',
    );
  }
  const results = [];
  for (const target of targets) {
    const result = { kind: target.kind, id: target.id, status: 'added' };
    try {
      await apiPost(itemsPath(slug), target.body, config);
    } catch (error) {
      if (!(error instanceof CliError)) {
        throw error;
      }
      if (/^Collection not found/.test(error.message)) {
        throw error;
      }
      if (/Already in this playlist/.test(error.message)) {
        result.status = 'already there';
      } else {
        result.status = 'failed';
        result.error = error.message;
      }
    }
    results.push(result);
  }
  const failed = results.some((result) => result.status === 'failed');
  const output = json
    ? JSON.stringify(results, null, 2)
    : formatTable(
        ['KIND', 'ID', 'RESULT'],
        results.map((result) => [
          result.kind,
          result.id,
          result.error ? `failed: ${result.error}` : result.status,
        ]),
      );
  return { output, exitCode: failed ? 1 : 0 };
}

export async function runCollectionsRemove(config, slug, position) {
  if (!slug || position === undefined) {
    throw new CliError(
      'Give a collection slug and an item number.\nRun `tahti collections remove --help` for usage.',
    );
  }
  const index = parsePositiveInt('item number', position);
  const collection = await fetchCollection(config, slug);
  const items = collection.items ?? [];
  const item = items[index - 1];
  if (!item) {
    throw new CliError(
      `"${collection.name}" has ${items.length} item${items.length === 1 ? '' : 's'}; there is no #${index}.`,
    );
  }
  await apiSendNoContent(
    'DELETE',
    `${itemsPath(slug)}/${encodeURIComponent(item.id)}`,
    config,
  );
  const title = item.sound?.title ?? item.release?.title ?? 'a removed item';
  return `Removed #${index} "${title}" from "${collection.name}".`;
}
