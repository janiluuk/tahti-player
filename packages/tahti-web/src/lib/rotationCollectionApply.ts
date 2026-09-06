import type { StudioCollectionItem } from '../api/studio-types';

export type CollectionRotationPlan =
  | { action: 'abort'; reason: 'empty-playlist' | 'already-in-rotation' }
  | { action: 'add'; addIds: string[] }
  | { action: 'replace'; addIds: string[]; removeIds: string[] };

function uniqueSoundIds(ids: readonly (string | null | undefined)[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(id);
  }
  return unique;
}

export function collectionRotationSoundIds(
  items: readonly StudioCollectionItem[] | undefined,
): string[] {
  return uniqueSoundIds(
    (items ?? [])
      .filter((item) => !item.sound?.embedProvider)
      .map((item) => item.soundId),
  );
}

export function planCollectionRotationApply(input: {
  replace: boolean;
  currentFallbackIds: readonly string[];
  incomingSoundIds: readonly string[];
}): CollectionRotationPlan {
  const incoming = uniqueSoundIds(input.incomingSoundIds);
  if (incoming.length === 0) {
    return { action: 'abort', reason: 'empty-playlist' };
  }
  if (input.replace) {
    const incomingSet = new Set(incoming);
    return {
      action: 'replace',
      addIds: incoming,
      removeIds: input.currentFallbackIds.filter((id) => !incomingSet.has(id)),
    };
  }
  const currentSet = new Set(input.currentFallbackIds);
  const addIds = incoming.filter((id) => !currentSet.has(id));
  if (addIds.length === 0) {
    return { action: 'abort', reason: 'already-in-rotation' };
  }
  return {
    action: 'add',
    addIds,
  };
}
