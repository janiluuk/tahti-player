import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';

import {
  fetchAutoRecordEnabled,
  patchAutoRecordEnabled,
} from '../../../api/broadcast';
import {
  fetchAutoPublishBroadcast,
  setAutoPublishBroadcast,
} from '../../../api/publish-defaults';
import { SettingsToggle } from '../SettingsFields';

export function BroadcastRecordingToggles() {
  const { t } = useTranslation('web');
  const [autoRecord, setAutoRecord] = useState<boolean | null>(null);
  const [autoPublish, setAutoPublish] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchAutoRecordEnabled(),
      fetchAutoPublishBroadcast(),
    ]).then(([record, publish]) => {
      if (cancelled) {
        return;
      }
      if (!record.meta.reason || record.meta.reason === 'VITE_FORCE_MOCK') {
        setAutoRecord(record.data);
      }
      if (publish.ok) {
        setAutoPublish(publish.autoPublish);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {autoRecord !== null ? (
        <SettingsToggle
          label={t('toggles.recording.recordLabel')}
          description={t('toggles.recording.recordDescription')}
          value={autoRecord}
          onChange={(value) => {
            const previous = autoRecord;
            setAutoRecord(value);
            void patchAutoRecordEnabled(value).then((result) => {
              if (!result.ok) {
                setAutoRecord(previous);
                toast.error(result.error);
                return;
              }
              toast.success(t('toggles.recording.recordSaved'));
            });
          }}
        />
      ) : null}
      {autoPublish !== null && autoRecord !== false ? (
        <SettingsToggle
          label={t('toggles.recording.publishLabel')}
          description={t('toggles.recording.publishDescription')}
          value={autoPublish}
          onChange={(value) => {
            const previous = autoPublish;
            setAutoPublish(value);
            void setAutoPublishBroadcast(value).then((result) => {
              if (!result.ok) {
                setAutoPublish(previous);
                toast.error(result.error);
                return;
              }
              setAutoPublish(result.autoPublish);
              toast.success(t('toggles.recording.publishSaved'));
            });
          }}
        />
      ) : null}
    </>
  );
}
