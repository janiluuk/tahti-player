import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  fetchTopListsOptOut,
  setTopListsOptOut,
} from '../../../api/me-top-lists';
import { SettingsToggle } from '../SettingsFields';

export function TopListsToggle() {
  const { t } = useTranslation('web');
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
      label={t('toggles.topLists.label')}
      description={t('toggles.topLists.description')}
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
          toast.success(t('toggles.topLists.saved'));
        });
      }}
    />
  );
}
