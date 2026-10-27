import { useState } from 'react';
import { toast } from 'sonner';

import { Button, ButtonLink } from '@tahti-player/ui';

import {
  loadGooglePicker,
  pickGoogleDriveFiles,
} from '../../../lib/googleDrivePicker';
import type { GoogleDriveSourceAdapter } from '../../../plugins/import-sources/types';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';

type Step = 'idle' | 'opening' | 'importing';

/** Picks audio files with Google's Picker and queues them as cloud imports. */
export function GoogleDriveImport({
  adapter,
  onConnectionLost,
}: {
  adapter: GoogleDriveSourceAdapter;
  onConnectionLost: () => void;
}) {
  const [step, setStep] = useState<Step>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const choose = async () => {
    setStep('opening');
    setMessage(null);
    try {
      const config = await adapter.pickerConfig();
      if (!config.ok) {
        setMessage(config.error);
        setUnavailable(config.reason === 'not-configured');
        if (config.reason === 'not-connected') {
          toast.error(config.error);
          onConnectionLost();
        }
        return;
      }
      const picker = await loadGooglePicker();
      const files = await pickGoogleDriveFiles(picker, config.data);
      if (files.length === 0) {
        return;
      }
      setStep('importing');
      const result = await adapter.importFiles(files);
      const text = result.ok
        ? `Queued import (${result.count}). Follow progress on Studio → Upload.`
        : result.error;
      setMessage(text);
      (result.ok ? toast.success : toast.error)(text);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Could not open Google Drive.',
      );
    } finally {
      setStep('idle');
    }
  };

  return (
    <div
      className="border-border flex flex-col gap-2 border-t pt-3"
      data-testid="google-drive-import"
    >
      <p className="text-foreground-secondary text-sm">
        Pick audio files from your Google Drive. Tahti fetches them on the
        server and adds them to your tracks.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="self-start"
          disabled={step !== 'idle' || unavailable}
          onClick={() => void choose()}
        >
          {step === 'opening'
            ? 'Opening Google Drive…'
            : step === 'importing'
              ? 'Queueing import…'
              : 'Choose files from Drive'}
        </Button>
        {unavailable ? (
          <ButtonLink
            to="/library/upload"
            size="sm"
            variant="secondary"
            onClick={() => useSettingsModalStore.getState().close()}
          >
            Upload files
          </ButtonLink>
        ) : null}
      </div>
      {message ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
