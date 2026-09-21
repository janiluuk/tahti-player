import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input, SaveButton } from '@tahti-player/ui';

import {
  testRadioStream,
  type RadioStreamTestResult,
} from '../../../api/radio-sources';
import type { RadioStation } from '../../../content/radioStations';
import { RadioStationCover } from '../../RadioStationCover';

/** Edit a curated Finnish station's metadata, cover and stream source.
 * Mount it only while a station is being edited (key it by station id) so
 * the drafts start from the station each time. */
export function StationEditDialog({
  station,
  onClose,
  onSave,
}: {
  station: RadioStation;
  onClose: () => void;
  onSave: (patch: Partial<RadioStation>) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(station.logoUrl ?? '');
  const [streamUrl, setStreamUrl] = useState(station.streamUrl ?? '');
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<RadioStreamTestResult | null>(
    null,
  );

  const runTest = async () => {
    setTestBusy(true);
    setTestResult(null);
    try {
      setTestResult(await testRadioStream(streamUrl.trim()));
    } catch {
      toast.error('Could not test the stream.');
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const bitrate = Number(form.get('bitrateKbps'));
          onSave({
            name: String(form.get('name') ?? '').trim(),
            language: String(form.get('language') ?? '').trim(),
            genre: String(form.get('genre') ?? '').trim(),
            // Keep the old bitrate if the field isn't a positive number.
            bitrateKbps:
              Number.isFinite(bitrate) && bitrate > 0
                ? bitrate
                : station.bitrateKbps,
            codec: String(form.get('codec') ?? '').trim(),
            logoUrl: logoUrl.trim(),
            streamUrl: streamUrl.trim() || null,
            detailUrl: String(form.get('detailUrl') ?? '').trim(),
          });
          toast.success(`Saved ${station.name}.`);
          onClose();
        }}
      >
        <Dialog.Title>Edit {station.name}</Dialog.Title>
        <Dialog.Description>
          Update the station metadata, cover image, and programming source.
        </Dialog.Description>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input name="name" label="Station name" defaultValue={station.name} />
          <Input
            name="language"
            label="Language"
            defaultValue={station.language}
          />
          <Input name="genre" label="Genre" defaultValue={station.genre} />
          <Input
            name="bitrateKbps"
            label="Bitrate (kbps)"
            defaultValue={String(station.bitrateKbps)}
            inputMode="numeric"
          />
          <Input name="codec" label="Codec" defaultValue={station.codec} />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Cover image</span>
            <RadioStationCover
              src={logoUrl}
              label={station.name}
              stationName={station.name}
              catalogStationId={station.id}
              className="h-28 w-28 overflow-hidden rounded-lg"
              onCoverChange={setLogoUrl}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Input
              label="Programming source / stream URL"
              value={streamUrl}
              onChange={(e) => {
                setStreamUrl(e.target.value);
                setTestResult(null);
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!streamUrl.trim() || testBusy}
                onClick={() => void runTest()}
              >
                {testBusy ? 'Testing…' : 'Test stream'}
              </Button>
              {testResult && (
                <p
                  className={`text-xs ${testResult.ok ? 'text-accent-green' : 'text-foreground-secondary'}`}
                >
                  {testResult.ok ? '✓ ' : ''}
                  {testResult.message}
                </p>
              )}
            </div>
          </div>
          <Input
            name="detailUrl"
            label="Station details URL"
            defaultValue={station.detailUrl}
            className="sm:col-span-2"
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <SaveButton type="submit" label="Save station" />
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
