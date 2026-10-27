import { bpmRanges, bpmShiftPercent, type BpmRange } from './bpm';
import {
  harmonicNeighbours,
  keyName,
  type HarmonicRelation,
} from './musicalKey';
import type {
  NativeLibraryTrack,
  NativeSmartDefinition,
  NativeSmartRule,
  TahtiNativeLibrary,
} from './nativeLibrary';

export type MixableMatch = {
  track: NativeLibraryTrack;
  relation: HarmonicRelation | null;
  bpmShift: number | null;
};

export type MixableOptions = {
  tolerancePercent: number;
  halfDouble: boolean;
  limit?: number;
};

const RELATION_ORDER: Record<HarmonicRelation, number> = {
  same: 0,
  up: 1,
  down: 1,
  relative: 2,
};

function draft(rules: NativeSmartRule[]): NativeSmartDefinition {
  return {
    name: 'Mixable',
    matchAll: true,
    rules,
    sort: 'bpm',
    descending: false,
    limit: null,
  };
}

function bpmRule(range: BpmRange): NativeSmartRule {
  return {
    field: 'bpm',
    op: 'between',
    value: String(range.min),
    value2: String(range.max),
  };
}

export function mixableQueries(
  track: Pick<NativeLibraryTrack, 'bpm' | 'musicalKey'>,
  options: MixableOptions,
): Array<{
  relation: HarmonicRelation | null;
  definition: NativeSmartDefinition;
}> {
  const neighbours = harmonicNeighbours(track.musicalKey);
  const ranges = track.bpm
    ? bpmRanges(track.bpm, options.tolerancePercent, options.halfDouble)
    : [];
  if (neighbours.length === 0 && ranges.length === 0) {
    return [];
  }
  const keyRules: Array<{
    relation: HarmonicRelation | null;
    rule: NativeSmartRule | null;
  }> =
    neighbours.length > 0
      ? neighbours.map(({ key, relation }) => ({
          relation,
          rule: { field: 'key', op: 'is', value: keyName(key) },
        }))
      : [{ relation: null, rule: null }];
  const bpmRules: Array<NativeSmartRule | null> =
    ranges.length > 0 ? ranges.map(bpmRule) : [null];
  return keyRules.flatMap(({ relation, rule }) =>
    bpmRules.map((bpm) => ({
      relation,
      definition: draft(
        [rule, bpm].filter((item): item is NativeSmartRule => item !== null),
      ),
    })),
  );
}

export function rankMatches(
  source: Pick<NativeLibraryTrack, 'id' | 'bpm'>,
  found: Array<{
    relation: HarmonicRelation | null;
    tracks: NativeLibraryTrack[];
  }>,
  limit: number,
): MixableMatch[] {
  const byId = new Map<string, MixableMatch>();
  for (const { relation, tracks } of found) {
    for (const track of tracks) {
      if (track.id === source.id || !track.available) {
        continue;
      }
      const existing = byId.get(track.id);
      const better =
        !existing ||
        (relation !== null &&
          (existing.relation === null ||
            RELATION_ORDER[relation] < RELATION_ORDER[existing.relation]));
      if (better) {
        byId.set(track.id, {
          track,
          relation,
          bpmShift:
            source.bpm && track.bpm
              ? bpmShiftPercent(source.bpm, track.bpm)
              : null,
        });
      }
    }
  }
  return [...byId.values()]
    .sort((a, b) => {
      const relation =
        (a.relation === null ? 3 : RELATION_ORDER[a.relation]) -
        (b.relation === null ? 3 : RELATION_ORDER[b.relation]);
      if (relation !== 0) {
        return relation;
      }
      return Math.abs(a.bpmShift ?? 0) - Math.abs(b.bpmShift ?? 0);
    })
    .slice(0, limit);
}

export async function findMixableTracks(
  library: TahtiNativeLibrary,
  track: NativeLibraryTrack,
  options: MixableOptions,
): Promise<MixableMatch[]> {
  const queries = mixableQueries(track, options);
  const found = await Promise.all(
    queries.map(async ({ relation, definition }) => ({
      relation,
      tracks: (await library.analysis.smart.evaluate(null, definition, 0))
        .tracks,
    })),
  );
  return rankMatches(track, found, options.limit ?? 25);
}

export async function addToPrepare(
  library: TahtiNativeLibrary,
  ids: string[],
  name: string,
): Promise<{ playlistName: string; created: boolean }> {
  const playlists = await library.playlists.list();
  let target = playlists.find(
    (playlist) => playlist.name.toLowerCase() === name.toLowerCase(),
  );
  const created = !target;
  if (!target) {
    target = await library.playlists.create(name);
  }
  const existing = new Set(await library.playlists.trackIds(target.id));
  const fresh = ids.filter((id) => !existing.has(id));
  if (fresh.length > 0) {
    await library.playlists.addTracks(target.id, fresh);
  }
  return { playlistName: target.name, created };
}
