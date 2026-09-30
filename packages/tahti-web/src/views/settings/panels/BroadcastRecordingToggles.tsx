import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      if (!record.meta.reason || record.meta.source === 'mock') {
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
          label="Record my broadcasts"
          description="Save each finished broadcast to your library as a recording."
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
              toast.success('Recording setting saved.');
            });
          }}
        />
      ) : null}
      {autoPublish !== null && autoRecord !== false ? (
        <SettingsToggle
          label="Publish recordings automatically"
          description="New broadcast recordings are public as soon as they're saved. You can still change this for a single show before going live."
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
              toast.success('Publishing setting saved.');
            });
          }}
        />
      ) : null}
    </>
  );
}
