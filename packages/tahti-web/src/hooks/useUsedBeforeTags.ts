import { useEffect, useState } from 'react';

import { fetchStudioSoundFacets } from '../api/studio';

/** Loads the artist's previously used sound tags for "Used before" chips. */
export function useUsedBeforeTags(enabled = true): string[] {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void fetchStudioSoundFacets(['tag']).then((res) => {
      if (cancelled) {
        return;
      }
      const values = (res.data.facets.tag ?? [])
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((entry) => entry.value)
        .filter(Boolean)
        .slice(0, 12);
      setTags(values);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return tags;
}
