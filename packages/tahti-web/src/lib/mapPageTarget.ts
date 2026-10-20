import { MAP_CASES, type MapCase } from '../content/mapScreens';
import type { MapCommentKind } from '../stores/mapNotesStore';

export type MapPageTarget = {
  kind: MapCommentKind;
  targetId: string;
  title: string;
  /** Atlas case when the current route matches a documented screen. */
  mapCase?: MapCase;
};

/** Best atlas case / page target for the live route (admin page comments). */
export function mapPageTargetForPath(pathname: string): MapPageTarget {
  const exact = MAP_CASES.find((c) => {
    const primary = c.new.route.split(',')[0]?.trim().split(/[\s?]/)[0];
    return primary === pathname;
  });
  if (exact) {
    return {
      kind: 'case',
      targetId: exact.id,
      title: exact.title,
      mapCase: exact,
    };
  }

  // Dynamic routes: match the longest documented prefix (e.g. /channel/$slug).
  let best: MapCase | undefined;
  let bestLen = 0;
  for (const c of MAP_CASES) {
    const primary = c.new.route.split(',')[0]?.trim().split(/[\s?]/)[0];
    if (!primary || !primary.includes('$')) {
      continue;
    }
    const pattern = primary.replace(/\$[A-Za-z0-9_]+/g, '[^/]+');
    const re = new RegExp(`^${pattern}$`);
    if (re.test(pathname) && primary.length > bestLen) {
      best = c;
      bestLen = primary.length;
    }
  }
  if (best) {
    return {
      kind: 'case',
      targetId: best.id,
      title: best.title,
      mapCase: best,
    };
  }

  return {
    kind: 'page',
    targetId: pathname,
    title: pathname,
  };
}
