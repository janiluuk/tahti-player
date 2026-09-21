import { PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input } from '@tahti-player/ui';

import {
  lookupStationByUrl,
  resolveStreamUrl,
  testRadioStream,
  type RadioStation as PublicRadioStation,
  type RadioStreamTestResult,
} from '../../../api/radio-sources';
import { flagEmoji } from '../../../lib/countries';
import type { SavedBrowserStation } from '../../../stores/listenerWidgetsStore';

type Resolution = {
  streamUrl: string;
  title?: string;
  found: PublicRadioStation | null;
  test: RadioStreamTestResult;
};

/** Add a station by pasting a stream/playlist URL: resolves, tests and looks
 * it up in Radio Browser before saving. Mount it only while open so its
 * draft state resets on close. */
export function AddStationUrlDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (station: SavedBrowserStation) => void;
}) {
  const [draft, setDraft] = useState('');
  const [description, setDescription] = useState('');
  const [programmingUrl, setProgrammingUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  // Bumped on every edit/resolve so a slow earlier resolve can't land after.
  const request = useRef(0);

  const resolve = async () => {
    const input = draft.trim();
    if (!input) {
      return;
    }
    const mine = ++request.current;
    setBusy(true);
    setResolution(null);
    try {
      const { streamUrl, title } = await resolveStreamUrl(input);
      const [found, test] = await Promise.all([
        lookupStationByUrl(streamUrl),
        testRadioStream(streamUrl),
      ]);
      if (mine === request.current) {
        setResolution({ streamUrl, title, found, test });
      }
    } catch {
      if (mine === request.current) {
        toast.error('Could not resolve that stream URL.');
      }
    } finally {
      if (mine === request.current) {
        setBusy(false);
      }
    }
  };

  const save = () => {
    if (!resolution) {
      return;
    }
    const { streamUrl, title, found } = resolution;
    const name = found?.name ?? title ?? streamUrl;
    onAdd({
      id: found?.id ?? streamUrl,
      name,
      streamUrl,
      favicon: found?.favicon,
      country: found?.country,
      homepage: found?.homepage,
      countryCode: found?.countryCode,
      description: description.trim() || undefined,
      programmingUrl: programmingUrl.trim() || undefined,
    });
    toast.success(`Added ${name} to your stations.`);
    onClose();
  };

  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>Add a station by URL</Dialog.Title>
      <Dialog.Description>
        Paste an M3U/M3U8 playlist or a direct stream URL. We'll validate it
        plays and look up its details in the public Radio Browser directory when
        it's listed there.
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-0 flex-1 basis-48"
            size="sm"
            value={draft}
            onChange={(e) => {
              request.current++;
              setBusy(false);
              setDraft(e.target.value);
              setResolution(null);
            }}
            placeholder="https://example.com/stream.m3u8"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!draft.trim() || busy}
            onClick={() => void resolve()}
          >
            {busy ? 'Testing…' : 'Resolve & test'}
          </Button>
        </div>
        {resolution && (
          <div className="border-border flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm">
            <span className="font-medium">
              {resolution.found?.name ??
                resolution.title ??
                resolution.streamUrl}
            </span>
            {resolution.found?.country && (
              <span className="text-foreground-secondary text-xs">
                {flagEmoji(resolution.found.countryCode)}{' '}
                {resolution.found.country}
              </span>
            )}
            <span
              className={`text-xs ${resolution.test.ok ? 'text-accent-green' : 'text-foreground-secondary'}`}
            >
              {resolution.test.ok ? '✓ ' : ''}
              {resolution.test.message}
            </span>
            {!resolution.found && (
              <span className="text-foreground-secondary text-xs">
                Not in the public station directory — saving with the name from
                the playlist, if any.
              </span>
            )}
          </div>
        )}
        <Input
          size="sm"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What makes this station worth keeping"
        />
        <Input
          size="sm"
          label="Programme schedule link (optional)"
          value={programmingUrl}
          onChange={(e) => setProgrammingUrl(e.target.value)}
          placeholder="https://station.example/schedule"
        />
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button type="button" disabled={!resolution} onClick={save}>
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          Add to my stations
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
