import { LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, FilterChips } from '@tahti-player/ui';

import type {
  NativeExportResult,
  NativeExportStyle,
  NativePlaylistSummary,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

/** What the finished export means for moving the file, in plain words. */
export function describeExport(
  result: NativeExportResult,
  style: NativeExportStyle,
): { title: string; description?: string } {
  const title = `Exported ${result.written} ${result.written === 1 ? 'track' : 'tracks'} to ${result.path}`;
  if (style === 'absolute') {
    return {
      title,
      description:
        'Full paths were written, so the list works on this computer but not on one with a different folder layout.',
    };
  }
  const notes: string[] = [];
  if (result.outsideRoot > 0) {
    notes.push(
      `${result.outsideRoot} ${result.outsideRoot === 1 ? 'file is' : 'files are'} outside the folder you saved to and ${result.outsideRoot === 1 ? 'is' : 'are'} written with ../ — ${result.outsideRoot === 1 ? 'it only resolves' : 'they only resolve'} if that folder layout is the same elsewhere.`,
    );
  }
  if (result.absoluteFallback > 0) {
    notes.push(
      `${result.absoluteFallback} ${result.absoluteFallback === 1 ? 'file is' : 'files are'} on another drive and ${result.absoluteFallback === 1 ? 'was' : 'were'} written as full paths.`,
    );
  }
  return {
    title,
    description: notes.length
      ? notes.join(' ')
      : 'Every file sits inside the folder you saved to, so the list keeps working if you move it together with the music.',
  };
}

type Props = {
  playlist: NativePlaylistSummary | null;
  library: TahtiNativeLibrary;
  onClose: () => void;
};

/** Chooses relative or absolute paths, then asks where to save the M3U8. */
export function PlaylistExportDialog({ playlist, library, onClose }: Props) {
  const [style, setStyle] = useState<NativeExportStyle>('relative');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!playlist) {
      return;
    }
    setBusy(true);
    try {
      const result = await library.playlists.exportM3u(playlist.id, style);
      if (result) {
        const message = describeExport(result, style);
        toast.success(message.title, { description: message.description });
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      isOpen={playlist !== null}
      onClose={() => (busy ? undefined : onClose())}
    >
      <Dialog.Title>Export “{playlist?.name}”</Dialog.Title>
      <Dialog.Description>
        Saves an M3U8 file (UTF-8) with every entry in order, repeats included.
        Entries whose file is missing are kept with their last known path.
      </Dialog.Description>
      <div className="flex flex-col gap-2 py-2">
        <span className="text-sm font-medium">File paths</span>
        <FilterChips
          items={[
            { id: 'relative', label: 'Relative to the saved file' },
            { id: 'absolute', label: 'Full paths' },
          ]}
          selected={style}
          onChange={(id) => setStyle(id as NativeExportStyle)}
        />
        <p className="text-foreground-secondary text-xs">
          {style === 'relative'
            ? 'Best for sharing or moving: the list keeps working if the file and the music move together. Files outside the folder you save to are written with ../ and only resolve if that layout is the same on the other side; files on another drive fall back to full paths.'
            : 'Works on this computer as it is, but not on another with a different folder layout.'}
        </p>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button disabled={busy} onClick={() => void run()}>
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Choose where to save…
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
