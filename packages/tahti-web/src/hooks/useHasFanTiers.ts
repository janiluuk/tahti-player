import { useEffect, useState } from 'react';

import { fetchFanTiers } from '../api/client';

/** Whether an artist offers any active fan tier: `null` until known, so a
 * Subscribe call-to-action can wait instead of linking to an empty page. */
export function useHasFanTiers(username: string | null): boolean | null {
  const [hasTiers, setHasTiers] = useState<boolean | null>(null);
  useEffect(() => {
    if (!username) {
      setHasTiers(null);
      return;
    }
    let cancelled = false;
    void fetchFanTiers(username).then(({ data }) => {
      if (!cancelled) {
        setHasTiers((data?.tiers ?? []).length > 0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username]);
  return hasTiers;
}
