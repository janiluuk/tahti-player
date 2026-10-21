import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchTopListsOptOut,
  setTopListsOptOut,
} from '../../../api/me-top-lists';
import { SettingsToggle } from '../SettingsFields';

export function TopListsToggle() {
  const [optOut, setOptOut] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchTopListsOptOut().then((result) => {
      if (!cancelled && result.ok) {
        setOptOut(result.optOut);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (optOut === null) {
    return null;
  }

  return (
    <SettingsToggle
      label="Put my new uploads in the top lists"
      description="Tracks you upload from now on can be ranked in Tahti's public top lists. Tracks you've already uploaded keep their own setting."
      value={!optOut}
      onChange={(include) => {
        const previous = optOut;
        setOptOut(!include);
        void setTopListsOptOut(!include).then((result) => {
          if (!result.ok) {
            setOptOut(previous);
            toast.error(result.error);
            return;
          }
          setOptOut(result.optOut);
          toast.success('Visibility setting saved.');
        });
      }}
    />
  );
}
